import {
  BadgePin,
  FruitCard,
  PolaroidFrame,
  StampCard,
  TapeStrip,
} from "@/components/JumiComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ClipboardCopy,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { Layout } from "../components/Layout";
import { PhoneStrapCustomizer } from "../components/PhoneStrapCustomizer";
import { useAuth } from "../hooks/use-auth";
import {
  useAddBestie,
  useMyProfile,
  useMyStrap,
  useRemoveBestie,
  useSaveProfile,
} from "../hooks/use-backend";
import { CHARM_PRESETS, CharmType, DIGITAL_CHARM_PRESETS } from "../types";
import type { UserProfile } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncatePrincipal(id: string, len = 10) {
  if (id.length <= len * 2) return id;
  return `${id.slice(0, len)}\u2026${id.slice(-6)}`;
}

// ─── Polaroid Avatar ─────────────────────────────────────────────────────────

interface PolaroidAvatarProps {
  avatarUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  displayName: string;
}

function PolaroidAvatar({
  avatarUrl,
  uploading,
  onUpload,
  displayName,
}: PolaroidAvatarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex flex-col items-center select-none">
      <PolaroidFrame
        src={avatarUrl ?? undefined}
        caption={displayName || "tap to change"}
        rotation={-2}
        className="w-[120px] cursor-pointer hover:scale-105 transition-smooth"
      >
        {!avatarUrl && (
          <div className="w-[88px] h-[88px] bg-[#EAF5E3] flex items-center justify-center rounded-sm">
            <User className="w-10 h-10 text-[#A8D672]/60" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-[#FFF6E9]/80 flex items-center justify-center z-10">
            <span className="text-2xl animate-spin">✨</span>
          </div>
        )}
      </PolaroidFrame>
      {/* Tape across top of polaroid */}
      <TapeStrip
        color="yellow"
        width={64}
        angle={-4}
        className="-top-2 left-1/2 -translate-x-1/2"
      />
      {/* Sparkle decorations */}
      <span className="absolute -top-1 -right-3 text-sm animate-[float_3s_ease-in-out_infinite]">
        ✨
      </span>
      <span
        className="absolute -bottom-1 -left-4 text-xs animate-[float_3.5s_ease-in-out_infinite]"
        style={{ animationDelay: "1s" }}
      >
        ⭐
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-ocid="profile.upload_button"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      {/* invisible click target over the whole polaroid */}
      <button
        type="button"
        aria-label="Change avatar"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onClick={() => fileRef.current?.click()}
      />
    </div>
  );
}

// ─── Inline Name Editor ───────────────────────────────────────────────────────

interface NameEditorProps {
  name: string;
  onSave: (name: string) => void;
  saving: boolean;
}

function NameEditor({ name, onSave, saving }: NameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  const commit = useCallback(() => {
    if (draft.trim() && draft.trim() !== name) {
      onSave(draft.trim());
    }
    setEditing(false);
  }, [draft, name, onSave]);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(name);
              setEditing(false);
            }
          }}
          className="text-center font-display text-xl font-bold bg-[#FFF6E9] border-[#A8D672]/50 focus:border-[#A8D672] w-48 rounded-xl"
          style={{ fontFamily: "'Figtree', sans-serif" }}
          data-ocid="profile.name_input"
          maxLength={32}
        />
        <button
          type="button"
          onClick={commit}
          disabled={saving}
          aria-label="Save name"
          data-ocid="profile.name_save_button"
          className="text-[#A8D672] hover:text-[#A8D672]/70 transition-colors"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(name);
            setEditing(false);
          }}
          aria-label="Cancel"
          data-ocid="profile.name_cancel_button"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      data-ocid="profile.name_edit_button"
      className="group flex items-center gap-2 hover:text-[#E85A5A] transition-colors"
    >
      <h2
        className="font-bold text-[22px] text-[#3D2C1E] group-hover:text-[#E85A5A] transition-colors lowercase"
        style={{ fontFamily: "'Figtree', sans-serif" }}
      >
        {name || "unnamed bestie"}
      </h2>
      <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#E85A5A]" />
    </button>
  );
}

// ─── Bestie Row ───────────────────────────────────────────────────────────────

interface BestieRowProps {
  principalText: string;
  index: number;
  onRemove: () => void;
  removing: boolean;
}

function BestieRow({
  principalText,
  index,
  onRemove,
  removing,
}: BestieRowProps) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(principalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const FRUIT_EMOJIS = ["🍓", "🍒", "🥝", "🍑", "🍇", "🍊"];
  const emoji = FRUIT_EMOJIS[index % FRUIT_EMOJIS.length];
  // stable 2–4° rotation
  const rot = ((index * 7 + 3) % 7) - 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: index * 0.05 }}
      className="group"
      data-ocid={`profile.bestie.item.${index + 1}`}
    >
      <StampCard
        label={truncatePrincipal(principalText, 8)}
        rotation={rot}
        className="w-full flex-row items-center gap-3"
      >
        <div className="flex items-center gap-3 w-full">
          <span className="text-lg flex-shrink-0">{emoji}</span>
          <button
            type="button"
            onClick={copyId}
            className="flex-1 min-w-0 text-left font-mono text-[10px] text-[#7A5C4A] hover:text-[#3D2C1E] transition-colors truncate"
            aria-label="Copy principal ID"
            title={principalText}
          >
            {copied ? (
              <span className="text-[#A8D672] font-body font-medium">
                Copied! 🎉
              </span>
            ) : (
              truncatePrincipal(principalText, 12)
            )}
          </button>
          {confirming ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  setConfirming(false);
                }}
                disabled={removing}
                data-ocid={`profile.bestie.confirm_button.${index + 1}`}
                className="text-[#E85A5A] hover:opacity-80 text-xs font-body font-semibold px-2 py-0.5 rounded-lg bg-[#E85A5A]/10 transition-smooth"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                data-ocid={`profile.bestie.cancel_button.${index + 1}`}
                className="text-muted-foreground hover:text-foreground px-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Remove bestie"
              data-ocid={`profile.bestie.delete_button.${index + 1}`}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[#E85A5A] transition-smooth flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </StampCard>
    </motion.div>
  );
}

// ─── Jumi Section Card ────────────────────────────────────────────────────────

function JumiSectionCard({
  title,
  emoji,
  children,
  stickerCorner,
  className,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
  stickerCorner?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative jumi-card p-5 overflow-visible ${className ?? ""}`}
    >
      {/* tape across top */}
      <TapeStrip color="pink" width={72} angle={-3} className="-top-2 left-6" />
      <div className="flex items-center gap-2 mb-4 mt-1">
        <span className="text-base">{emoji}</span>
        <h2
          className="font-bold text-sm text-[#3D2C1E] uppercase tracking-wider lowercase"
          style={{ fontFamily: "'Figtree', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      {children}
      {stickerCorner && (
        <span className="absolute -top-3 -right-2 text-2xl rotate-12 pointer-events-none select-none">
          {stickerCorner}
        </span>
      )}
    </div>
  );
}

// ─── Digital Charm Cluster ────────────────────────────────────────────────────

const CHARM_POSITIONS = [
  { top: "-16px", right: "-24px", rotate: 12 },
  { top: "-20px", left: "-20px", rotate: -8 },
  { bottom: "0px", right: "-28px", rotate: 18 },
  { bottom: "-8px", left: "-24px", rotate: -14 },
  { top: "40%", right: "-32px", rotate: 5 },
];

function CharmCluster() {
  return (
    <>
      {DIGITAL_CHARM_PRESETS.map((charm, i) => {
        const pos = CHARM_POSITIONS[i % CHARM_POSITIONS.length];
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: purely visual static list
          <div
            key={charm.id}
            className="absolute w-16 h-16 rounded-full overflow-hidden sticker-shadow border-2 border-[#FFF6E9]"
            style={{
              ...(pos.top !== undefined ? { top: pos.top } : {}),
              ...(pos.bottom !== undefined ? { bottom: pos.bottom } : {}),
              ...(pos.left !== undefined ? { left: pos.left } : {}),
              ...(pos.right !== undefined ? { right: pos.right } : {}),
              transform: `rotate(${pos.rotate}deg)`,
              zIndex: 10,
            }}
            aria-hidden="true"
          >
            <img
              src={charm.imagePath}
              alt={charm.labelText}
              className="sticker-img w-full h-full object-cover"
            />
          </div>
        );
      })}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { isAuthenticated, isLoading, principal } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const saveProfile = useSaveProfile();
  const addBestie = useAddBestie();
  const removeBestie = useRemoveBestie();

  const { data: strap } = useMyStrap();
  const [strapOpen, setStrapOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newBestieId, setNewBestieId] = useState("");
  const [addingBestie, setAddingBestie] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const [copiedInbox, setCopiedInbox] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Set avatar URL from profile
  useEffect(() => {
    if (profile?.avatar) {
      try {
        setAvatarUrl(profile.avatar.getDirectURL());
      } catch {
        setAvatarUrl(null);
      }
    }
  }, [profile]);

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (!profile) return;
      setAvatarUploading(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        const updated: UserProfile = { ...profile, avatar: blob };
        await saveProfile.mutateAsync(updated);
        const localUrl = URL.createObjectURL(file);
        setAvatarUrl(localUrl);
        toast.success("Avatar updated! ✨");
      } catch {
        toast.error("Couldn't upload avatar. Try again!");
      } finally {
        setAvatarUploading(false);
      }
    },
    [profile, saveProfile],
  );

  const handleSaveName = useCallback(
    async (name: string) => {
      if (!profile) return;
      try {
        await saveProfile.mutateAsync({ ...profile, name });
        toast.success("Name saved! 💗");
      } catch {
        toast.error("Couldn't save name.");
      }
    },
    [profile, saveProfile],
  );

  const handleAddBestie = useCallback(async () => {
    const trimmed = newBestieId.trim();
    if (!trimmed) return;
    setAddingBestie(true);
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(trimmed);
      await addBestie.mutateAsync(p);
      setNewBestieId("");
      toast.success("Bestie added! 🍓");
    } catch {
      toast.error("Invalid principal ID. Check the format!");
    } finally {
      setAddingBestie(false);
    }
  }, [newBestieId, addBestie]);

  const handleRemoveBestie = useCallback(
    async (principalText: string) => {
      try {
        const { Principal } = await import("@icp-sdk/core/principal");
        const p = Principal.fromText(principalText);
        await removeBestie.mutateAsync(p);
        toast.success("Bestie removed 💔");
      } catch {
        toast.error("Couldn't remove bestie.");
      }
    },
    [removeBestie],
  );

  const copyPrincipal = useCallback(async () => {
    if (!principal) return;
    await navigator.clipboard.writeText(principal.toText());
    setCopiedPrincipal(true);
    setTimeout(() => setCopiedPrincipal(false), 2000);
  }, [principal]);

  const inboxUrl = principal ? principal.toText() : "";

  const copyInboxLink = useCallback(async () => {
    if (!inboxUrl) return;
    await navigator.clipboard.writeText(inboxUrl);
    setCopiedInbox(true);
    setTimeout(() => setCopiedInbox(false), 2000);
  }, [inboxUrl]);

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading || profileLoading) {
    return (
      <Layout>
        <div
          className="max-w-md mx-auto flex flex-col items-center gap-6 pt-4"
          data-ocid="profile.loading_state"
        >
          <Skeleton className="w-28 h-36 rounded-sm" />
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const besties = profile?.besties ?? [];
  const displayName = profile?.name || "";

  return (
    <Layout>
      {/* Gingham background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 jumi-gingham"
        aria-hidden
      />

      {/* Top tape strip decoration */}
      <div className="relative w-full h-0 z-20 pointer-events-none" aria-hidden>
        <TapeStrip
          color="yellow"
          width="45%"
          angle={-1}
          className="top-0 left-[4%]"
        />
        <TapeStrip
          color="pink"
          width="30%"
          angle={2}
          className="top-0 left-[52%]"
        />
        <TapeStrip
          color="green"
          width="18%"
          angle={-2}
          className="top-0 right-[2%]"
        />
      </div>

      <div
        className="relative z-10 max-w-md mx-auto flex flex-col gap-6 pb-24 md:pb-6 pt-6"
        data-ocid="profile.page"
      >
        {/* ── Page Title ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-1"
        >
          <h1
            className="lowercase"
            style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: "28px",
              fontWeight: 800,
              color: "#E85A5A",
              letterSpacing: "-0.5px",
            }}
          >
            my profile 🎒
          </h1>
        </motion.div>

        {/* ── Identity Cluster ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3 pt-4"
        >
          {/* Avatar + Charm cluster */}
          <div className="relative flex items-center justify-center">
            {/* Charm images clustered around avatar */}
            <CharmCluster />
            {/* Polaroid avatar */}
            <div className="relative z-20">
              <PolaroidAvatar
                avatarUrl={avatarUrl}
                uploading={avatarUploading}
                onUpload={handleAvatarUpload}
                displayName={displayName}
              />
            </div>
          </div>

          {/* Name + Principal */}
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <NameEditor
              name={displayName}
              onSave={handleSaveName}
              saving={saveProfile.isPending}
            />
            {principal && (
              <button
                type="button"
                onClick={copyPrincipal}
                data-ocid="profile.principal_copy_button"
                className="flex items-center gap-1.5 group"
                aria-label="Copy principal ID"
              >
                <span className="font-mono text-[10px] text-[#7A5C4A]/70 group-hover:text-[#3D2C1E] transition-colors truncate max-w-[200px]">
                  {truncatePrincipal(principal.toText(), 10)}
                </span>
                {copiedPrincipal ? (
                  <span className="text-[10px] text-[#A8D672] font-body font-semibold">
                    Copied!
                  </span>
                ) : (
                  <ClipboardCopy className="w-3 h-3 text-[#7A5C4A]/50 group-hover:text-[#A8D672] transition-colors" />
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Stats Row ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex gap-3 justify-center"
        >
          {[
            { label: "letters sent", value: "—", icon: "📮" },
            { label: "received", value: "—", icon: "📬" },
            { label: "besties", value: besties.length, icon: "🍓" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="jumi-card flex flex-col items-center gap-1 px-4 py-3 min-w-[80px]"
            >
              <span className="text-lg">{stat.icon}</span>
              <span
                className="font-bold text-lg"
                style={{
                  fontFamily: "'Figtree', sans-serif",
                  color: "#A8D672",
                }}
              >
                {stat.value}
              </span>
              <span
                className="text-[9px] text-[#7A5C4A] text-center leading-tight"
                style={{ fontFamily: "Caveat, cursive" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Digital Charms Collection Grid ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <JumiSectionCard
            title="charm collection"
            emoji="💎"
            stickerCorner="⭐"
          >
            <div className="grid grid-cols-3 gap-3">
              {DIGITAL_CHARM_PRESETS.map((charm, i) => {
                const rot = ((i * 11 + 2) % 9) - 4;
                return (
                  <FruitCard
                    key={charm.id}
                    fruitEmoji={charm.emoji}
                    rotation={rot}
                    cycle={i % 4}
                    className="flex flex-col items-center gap-2 py-3"
                  >
                    <img
                      src={charm.imagePath}
                      alt={charm.labelText}
                      className="sticker-img w-10 h-10 rounded-full object-cover"
                    />
                    <span
                      className="text-[11px] text-[#3D2C1E] text-center leading-tight"
                      style={{ fontFamily: "Caveat, cursive" }}
                    >
                      {charm.labelText}
                    </span>
                  </FruitCard>
                );
              })}
              {/* Regular charm badges */}
              {CHARM_PRESETS.slice(0, 3).map((charm, i) => (
                <FruitCard
                  key={charm.id}
                  fruitEmoji={charm.emoji}
                  rotation={((i * 7 + 5) % 9) - 4}
                  cycle={(i + 2) % 4}
                  className="flex flex-col items-center gap-1 py-3"
                >
                  <BadgePin icon={charm.emoji} />
                  <span
                    className="text-[11px] text-[#3D2C1E] text-center leading-tight"
                    style={{ fontFamily: "Caveat, cursive" }}
                  >
                    {charm.labelText}
                  </span>
                </FruitCard>
              ))}
            </div>
          </JumiSectionCard>
        </motion.div>

        {/* ── Phone Strap ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <JumiSectionCard title="my phone strap" emoji="📿" stickerCorner="💗">
            <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
              {(strap?.charms ?? []).length === 0 ? (
                <p
                  className="text-xs text-[#7A5C4A] font-body"
                  data-ocid="profile.strap.empty_state"
                >
                  No charms yet — customize your strap!
                </p>
              ) : (
                (strap?.charms ?? []).map((charm, i) => {
                  const isStrawberry = [
                    "strawberry",
                    "apple",
                    "heart",
                    "candy",
                    "ladybug",
                  ].includes(charm.presetId);
                  const digitalPreset =
                    charm.charmType === CharmType.preset
                      ? DIGITAL_CHARM_PRESETS.find(
                          (p) => p.id === charm.presetId,
                        )
                      : null;
                  const regularPreset =
                    charm.charmType === CharmType.preset && !digitalPreset
                      ? CHARM_PRESETS.find((p) => p.id === charm.presetId)
                      : null;
                  const charmEmoji = regularPreset?.emoji ?? "💗";
                  return (
                    <span
                      key={charm.id}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-body border-2 bg-[#FFF6E9] ${
                        isStrawberry
                          ? "border-[#E85A5A]/50 text-[#3D2C1E]"
                          : "border-[#A8D672]/50 text-[#3D2C1E]"
                      }`}
                      data-ocid={`profile.strap.charm.${i + 1}`}
                    >
                      {charm.charmType === CharmType.custom ? (
                        "📷"
                      ) : digitalPreset?.imagePath ? (
                        <img
                          src={digitalPreset.imagePath}
                          alt={digitalPreset.labelText}
                          className="w-4 h-4 rounded-full object-cover mix-blend-multiply"
                        />
                      ) : (
                        charmEmoji
                      )}
                      <span>{charm.labelText}</span>
                    </span>
                  );
                })
              )}
            </div>
            <button
              type="button"
              onClick={() => setStrapOpen(true)}
              data-ocid="profile.strap.open_modal_button"
              className="jumi-btn-primary w-full text-center"
            >
              ✨ Customize Strap
            </button>
          </JumiSectionCard>
        </motion.div>

        <PhoneStrapCustomizer
          open={strapOpen}
          onClose={() => setStrapOpen(false)}
        />

        {/* ── Inbox Address ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <JumiSectionCard
            title="your inbox address"
            emoji="📬"
            stickerCorner="💌"
          >
            <p className="text-xs text-[#7A5C4A] font-body mb-3">
              Share your{" "}
              <span className="font-semibold text-[#3D2C1E]">
                inbox address
              </span>{" "}
              with friends so they can send you VibeMails! 🌸
            </p>
            <div className="flex items-center gap-2 bg-[#EAF5E3] rounded-xl px-3 py-2 border border-[#A8D672]/40">
              <span
                className="flex-1 min-w-0 font-mono text-[10px] text-[#7A5C4A] break-all"
                data-ocid="profile.inbox_link"
              >
                {inboxUrl || "Sign in to get your inbox address"}
              </span>
              <button
                type="button"
                onClick={copyInboxLink}
                disabled={!inboxUrl}
                data-ocid="profile.inbox_copy_button"
                className="jumi-btn-primary shrink-0 text-xs px-3 py-1.5"
              >
                {copiedInbox ? (
                  <span className="font-semibold">Copied! 🎉</span>
                ) : (
                  <>
                    <ClipboardCopy className="w-3.5 h-3.5 inline mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-[#7A5C4A]/70 font-body mt-2">
              This is your principal ID — paste it in the "To:" field when
              composing a letter.
            </p>
          </JumiSectionCard>
        </motion.div>

        {/* ── Bestie List ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <JumiSectionCard title="bestie list 🍀" emoji="🍓" stickerCorner="💗">
            {/* Add bestie input */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Paste a principal ID…"
                value={newBestieId}
                onChange={(e) => setNewBestieId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddBestie()}
                className="flex-1 text-xs font-mono bg-[#FFF6E9] border-[#A8D672]/50 focus:border-[#A8D672] h-9 rounded-xl"
                data-ocid="profile.add_bestie_input"
              />
              <button
                type="button"
                onClick={handleAddBestie}
                disabled={!newBestieId.trim() || addingBestie}
                data-ocid="profile.add_bestie_button"
                className="jumi-btn-primary h-9 px-3 shrink-0 flex items-center"
              >
                {addingBestie ? (
                  <span className="animate-spin text-sm">✨</span>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Bestie stamp cards */}
            {besties.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-6"
                data-ocid="profile.besties.empty_state"
              >
                <span className="text-3xl opacity-40">🌸</span>
                <p className="text-sm text-[#7A5C4A] font-body text-center">
                  No besties yet — add a friend's ID to connect!
                </p>
              </div>
            ) : (
              <div
                className="flex flex-col gap-3"
                data-ocid="profile.besties.list"
              >
                {besties.map((p, i) => (
                  <BestieRow
                    key={p.toText()}
                    principalText={p.toText()}
                    index={i}
                    onRemove={() => handleRemoveBestie(p.toText())}
                    removing={removeBestie.isPending}
                  />
                ))}
              </div>
            )}
          </JumiSectionCard>
        </motion.div>

        {/* ── Decorative floating emojis ───────────────────────────── */}
        <div
          className="flex justify-center gap-6 pb-2 pointer-events-none select-none"
          aria-hidden
        >
          {(["🍒", "🦋", "🐞"] as const).map((e) => (
            <span
              key={e}
              className="text-xl opacity-50 animate-[float_4s_ease-in-out_infinite]"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </Layout>
  );
}
