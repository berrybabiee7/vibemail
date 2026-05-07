import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AnimatePresence, Reorder, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useAddCharm,
  useMyStrap,
  useRemoveCharm,
  useReorderCharms,
  useSaveStrap,
} from "../hooks/use-backend";
import type { Charm } from "../types";
import { CHARM_PRESETS, CharmType, DIGITAL_CHARM_PRESETS } from "../types";

// ─── Charm Badge ─────────────────────────────────────────────────────────────

interface CharmBadgeProps {
  charm: Charm;
  customImageUrl?: string;
  onRemove?: () => void;
  isDragging?: boolean;
}

function CharmBadge({
  charm,
  customImageUrl,
  onRemove,
  isDragging,
}: CharmBadgeProps) {
  const preset = CHARM_PRESETS.find((p) => p.id === charm.presetId);
  const emoji = preset?.emoji ?? "💗";
  const isStrawberry = [
    "strawberry",
    "apple",
    "heart",
    "candy",
    "ladybug",
  ].includes(charm.presetId);

  return (
    <motion.div
      layout
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      whileHover={{ scale: 1.08 }}
      className={cn(
        "relative flex flex-col items-center gap-1 p-2 rounded-2xl border-2 cursor-grab active:cursor-grabbing select-none",
        "bg-card transition-smooth",
        isDragging ? "shadow-lg z-50 rotate-3" : "hover:shadow-md",
        isStrawberry
          ? "border-[oklch(0.56_0.24_15/0.5)] hover:border-[oklch(0.56_0.24_15/0.8)]"
          : "border-[oklch(0.68_0.12_145/0.5)] hover:border-[oklch(0.68_0.12_145/0.8)]",
      )}
    >
      {/* Charm image or emoji */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-muted/50 border border-border">
        {customImageUrl ? (
          <img
            src={customImageUrl}
            alt={charm.labelText}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">{emoji}</span>
        )}
      </div>
      <span className="text-[9px] font-body text-muted-foreground text-center leading-tight max-w-[52px] truncate">
        {charm.labelText}
      </span>
      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove charm"
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity shadow-sm"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}

// ─── Digital Charm Grid Item ──────────────────────────────────────────────────

interface DigitalCharmItemProps {
  id: string;
  label: string;
  imagePath: string;
  isActive: boolean;
  onAdd: () => void;
}

function DigitalCharmItem({
  id,
  label,
  imagePath,
  isActive,
  onAdd,
}: DigitalCharmItemProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAdd}
      data-ocid={`strap.digital_charm.${id}`}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-smooth",
        isActive
          ? "bg-primary/10 border-primary/60 shadow-sm"
          : "bg-card border-border hover:border-accent/60 hover:bg-accent/5",
      )}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/40 bg-muted/30">
        <img
          src={imagePath}
          alt={label}
          className="w-full h-full object-cover mix-blend-multiply"
          draggable={false}
        />
      </div>
      <span className="text-[9px] font-body text-muted-foreground text-center leading-tight max-w-[60px]">
        {label}
      </span>
      {isActive && (
        <span className="text-[8px] font-body font-semibold text-primary">
          ✓ Added
        </span>
      )}
    </motion.button>
  );
}

// ─── Preset Grid Item ─────────────────────────────────────────────────────────

interface PresetItemProps {
  id: string;
  emoji: string;
  label: string;
  isActive: boolean;
  onAdd: () => void;
}

function PresetItem({ id, emoji, label, isActive, onAdd }: PresetItemProps) {
  const isStrawberry = [
    "strawberry",
    "apple",
    "heart",
    "candy",
    "ladybug",
  ].includes(id);
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAdd}
      data-ocid={`strap.preset.${id}`}
      className={cn(
        "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-smooth",
        isActive
          ? "bg-primary/10 border-primary/60 shadow-sm"
          : cn(
              "bg-card hover:bg-accent/5",
              isStrawberry
                ? "border-border hover:border-[oklch(0.56_0.24_15/0.5)]"
                : "border-border hover:border-[oklch(0.68_0.12_145/0.5)]",
            ),
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-[9px] font-body text-muted-foreground">
        {label}
      </span>
      {isActive && (
        <span className="text-[8px] font-body font-semibold text-primary">
          ✓ Added
        </span>
      )}
    </motion.button>
  );
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

interface UploadTabProps {
  onUpload: (file: File, labelText: string) => Promise<void>;
  uploading: boolean;
}

function UploadTab({ onUpload, uploading }: UploadTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFile = (file: File) => {
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
    if (!label) setLabel(file.name.replace(/\.[^.]+$/, "").slice(0, 20));
  };

  const handleSubmit = async () => {
    if (!pendingFile) return;
    await onUpload(pendingFile, label || "My Charm");
    setPreview(null);
    setPendingFile(null);
    setLabel("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <button
        type="button"
        aria-label="Drop zone for charm image upload"
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-3 transition-smooth cursor-pointer w-full",
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/60 hover:bg-muted/30",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith("image/")) handleFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        data-ocid="strap.upload.dropzone"
      >
        {preview ? (
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-accent/60 shadow-md">
            <img
              src={preview}
              alt="charm preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center text-3xl">
              📷
            </div>
            <p className="text-xs font-body text-muted-foreground text-center">
              Tap to choose or drag a photo
            </p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          data-ocid="strap.upload_button"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </button>

      {/* Label input */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <label
            htmlFor="charm-name-input"
            className="text-xs font-body text-muted-foreground"
          >
            Charm name
          </label>
          <input
            id="charm-name-input"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={20}
            placeholder="e.g. My Cat"
            data-ocid="strap.custom_label_input"
            className="h-9 px-3 rounded-xl border border-border bg-background text-sm font-body focus:outline-none focus:border-accent transition-smooth"
          />
          <Button
            onClick={handleSubmit}
            disabled={uploading}
            data-ocid="strap.add_custom_charm_button"
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold"
          >
            {uploading ? <span className="animate-spin mr-2">✨</span> : "✨"}{" "}
            Add as Charm
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Customizer ──────────────────────────────────────────────────────────

interface PhoneStrapCustomizerProps {
  open: boolean;
  onClose: () => void;
}

export function PhoneStrapCustomizer({
  open,
  onClose,
}: PhoneStrapCustomizerProps) {
  const { data: strap } = useMyStrap();
  const saveStrap = useSaveStrap();
  const addCharm = useAddCharm();
  const removeCharm = useRemoveCharm();
  const reorderCharms = useReorderCharms();

  const [localCharms, setLocalCharms] = useState<Charm[]>([]);
  const [uploading, setUploading] = useState(false);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  // Sync from backend
  useEffect(() => {
    if (strap?.charms) setLocalCharms([...strap.charms]);
  }, [strap]);

  // Load custom image URLs
  useEffect(() => {
    const load = async () => {
      const updates: Record<string, string> = {};
      for (const charm of localCharms) {
        if (
          charm.charmType === CharmType.custom &&
          charm.customKey &&
          !customImages[charm.id]
        ) {
          try {
            const blob = ExternalBlob.fromURL(charm.customKey);
            updates[charm.id] = blob.getDirectURL();
          } catch {
            // skip
          }
        }
      }
      if (Object.keys(updates).length > 0) {
        setCustomImages((prev) => ({ ...prev, ...updates }));
      }
    };
    load();
  }, [localCharms, customImages]);

  const activePresetIds = new Set(
    localCharms
      .filter((c) => c.charmType === CharmType.preset)
      .map((c) => c.presetId),
  );

  const handleAddPreset = useCallback(
    async (presetId: string) => {
      if (activePresetIds.has(presetId)) {
        toast("Already on your strap! 💗");
        return;
      }
      if (localCharms.length >= 10) {
        toast("Max 10 charms on a strap!");
        return;
      }
      const allPresets = [...CHARM_PRESETS, ...DIGITAL_CHARM_PRESETS];
      const preset = allPresets.find((p) => p.id === presetId);
      if (!preset) return;
      const charm: Charm = {
        id: `${presetId}-${Date.now()}`,
        charmType: CharmType.preset,
        presetId,
        labelText: preset.labelText,
        position: BigInt(localCharms.length),
        customKey: undefined,
      };
      setLocalCharms((prev) => [...prev, charm]);
      try {
        await addCharm.mutateAsync(charm);
        toast.success(`${preset.emoji} ${preset.labelText} added!`);
      } catch {
        setLocalCharms((prev) => prev.filter((c) => c.id !== charm.id));
        toast.error("Couldn't add charm.");
      }
    },
    [activePresetIds, localCharms.length, addCharm],
  );

  const handleRemoveCharm = useCallback(
    async (charmId: string) => {
      const before = [...localCharms];
      setLocalCharms((prev) => prev.filter((c) => c.id !== charmId));
      try {
        await removeCharm.mutateAsync(charmId);
        toast.success("Charm removed 🗑️");
      } catch {
        setLocalCharms(before);
        toast.error("Couldn't remove charm.");
      }
    },
    [localCharms, removeCharm],
  );

  const handleReorder = useCallback(
    async (newOrder: Charm[]) => {
      setLocalCharms(newOrder);
      try {
        await reorderCharms.mutateAsync(newOrder.map((c) => c.id));
      } catch {
        toast.error("Couldn't save order.");
      }
    },
    [reorderCharms],
  );

  const handleUpload = useCallback(
    async (file: File, labelText: string) => {
      if (localCharms.length >= 10) {
        toast("Max 10 charms on a strap!");
        return;
      }
      setUploading(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        const charm: Charm = {
          id: `custom-${Date.now()}`,
          charmType: CharmType.custom,
          presetId: "custom",
          labelText,
          position: BigInt(localCharms.length),
          customKey: blob.getDirectURL(),
        };
        const localUrl = URL.createObjectURL(file);
        setLocalCharms((prev) => [...prev, charm]);
        setCustomImages((prev) => ({ ...prev, [charm.id]: localUrl }));
        await addCharm.mutateAsync(charm);
        toast.success("✨ Custom charm added!");
      } catch {
        toast.error("Upload failed. Try again!");
      } finally {
        setUploading(false);
      }
    },
    [localCharms.length, addCharm],
  );

  const handleSaveAndClose = async () => {
    try {
      await saveStrap.mutateAsync(localCharms);
      toast.success("Strap saved! 📿");
    } catch {
      // already saved incrementally
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto bg-card rounded-t-3xl border-t-2 border-border shadow-2xl"
            data-ocid="strap.dialog"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-muted" />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between py-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📿</span>
                  <h2 className="font-display font-bold text-lg text-foreground">
                    My Phone Strap
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close customizer"
                  data-ocid="strap.close_button"
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
                >
                  ×
                </button>
              </div>

              {/* Current strap preview */}
              <div className="mb-4">
                <p className="text-xs font-body text-muted-foreground mb-2">
                  Your strap · {localCharms.length}/10 charms · drag to reorder
                </p>
                {localCharms.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-20 rounded-2xl border-2 border-dashed border-border bg-muted/20"
                    data-ocid="strap.list.empty_state"
                  >
                    <p className="text-xs text-muted-foreground font-body">
                      Add charms below 🌸
                    </p>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="x"
                    values={localCharms}
                    onReorder={handleReorder}
                    className="flex flex-wrap gap-2"
                    data-ocid="strap.list"
                  >
                    <AnimatePresence>
                      {localCharms.map((charm, i) => (
                        <Reorder.Item
                          key={charm.id}
                          value={charm}
                          className="group"
                        >
                          <CharmBadge
                            charm={charm}
                            customImageUrl={customImages[charm.id]}
                            onRemove={() => handleRemoveCharm(charm.id)}
                            key={charm.id}
                          />
                          <span className="sr-only">
                            Charm {i + 1}: {charm.labelText}
                          </span>
                        </Reorder.Item>
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="presets">
                <TabsList className="w-full rounded-2xl bg-muted/60 p-1 mb-4">
                  <TabsTrigger
                    value="presets"
                    className="flex-1 rounded-xl text-[10px] font-body"
                    data-ocid="strap.presets_tab"
                  >
                    🍓 Charms
                  </TabsTrigger>
                  <TabsTrigger
                    value="digital"
                    className="flex-1 rounded-xl text-[10px] font-body"
                    data-ocid="strap.digital_charms_tab"
                  >
                    ✨ Digital
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="flex-1 rounded-xl text-[10px] font-body"
                    data-ocid="strap.upload_tab"
                  >
                    📷 Custom
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="presets">
                  <div
                    className="grid grid-cols-5 gap-2"
                    data-ocid="strap.presets.list"
                  >
                    {CHARM_PRESETS.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        id={preset.id}
                        emoji={preset.emoji}
                        label={preset.labelText}
                        isActive={activePresetIds.has(preset.id)}
                        onAdd={() => handleAddPreset(preset.id)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="digital">
                  <div className="mb-2">
                    <p className="text-[10px] font-body text-muted-foreground mb-3 flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Digital Charms — real kawaii collectibles</span>
                    </p>
                    <div
                      className="grid grid-cols-3 gap-3"
                      data-ocid="strap.digital_charms.list"
                    >
                      {DIGITAL_CHARM_PRESETS.map((charm) => (
                        <DigitalCharmItem
                          key={charm.id}
                          id={charm.id}
                          label={charm.labelText}
                          imagePath={charm.imagePath!}
                          isActive={activePresetIds.has(charm.id)}
                          onAdd={() => handleAddPreset(charm.id)}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload">
                  <UploadTab onUpload={handleUpload} uploading={uploading} />
                </TabsContent>
              </Tabs>

              {/* Save button */}
              <Button
                onClick={handleSaveAndClose}
                disabled={saveStrap.isPending}
                data-ocid="strap.save_button"
                className="w-full mt-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold"
              >
                {saveStrap.isPending ? (
                  <span className="animate-spin mr-2">✨</span>
                ) : (
                  "💾"
                )}{" "}
                Save Strap
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
