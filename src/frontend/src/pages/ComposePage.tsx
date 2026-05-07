import { ImageDivider } from "@/components/ImageDivider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import {
  FruitCard,
  PolaroidFrame,
  PouchContainer,
  StampCard,
  TapeStrip,
} from "../components/JumiComponents";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/use-auth";
import { useCreateLetter } from "../hooks/use-backend";
import {
  EnvelopeTexture,
  MusicLoop,
  PHOTO_FRAME_OPTIONS,
  UNBOXING_LABELS,
  UnboxingType,
} from "../types";
import type { CreateLetterInput } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────────────
interface UploadedPhoto {
  blob: ExternalBlob;
  previewUrl: string;
  flipNote: string;
  id: string;
}

// ─── Asset Constants ───────────────────────────────────────────────────────────────────

const SEAL_OPTIONS = [
  { id: "bow", src: "/assets/seals/seal-bow.png", label: "Pearl Bow" },
  { id: "cloud", src: "/assets/seals/seal-cloud.png", label: "Blue Cloud" },
];

// Step stamps cycling: 📮 ✍️ 🎁 ✨
const STEP_STAMPS = ["📮", "✍️", "🎁", "✨"];
const STEP_LABELS = ["📸 photos", "✏️ write", "✨ dress up", "💌 send!"];

const OPEN_WHEN_PRESETS = [
  "Open when you wake up ☀️",
  "Open when you're feeling sad 🌧️",
  "Open when you miss me 💞",
  "Open when you need a smile 🌸",
  "Open when you're bored 🎠",
];

const ENVELOPE_OPTIONS: {
  value: EnvelopeTexture;
  label: string;
  icon: string;
  className: string;
}[] = [
  {
    value: EnvelopeTexture.gingham,
    label: "Green Gingham",
    icon: "🍃",
    className: "bg-secondary/20 border-secondary/50",
  },
  {
    value: EnvelopeTexture.frosted,
    label: "Frosted Plastic",
    icon: "🫇",
    className: "bg-card/50 backdrop-blur-sm border-white/40",
  },
  {
    value: EnvelopeTexture.holographic,
    label: "Holographic",
    icon: "🌈",
    className: "holographic-shimmer border-accent/40",
  },
];

const MUSIC_OPTIONS: {
  value: MusicLoop | "none";
  label: string;
  icon: string;
  desc: string;
}[] = [
  { value: "none", label: "No Music", icon: "🔇", desc: "Peaceful silence" },
  {
    value: MusicLoop.lofi,
    label: "Lo-fi Beats",
    icon: "🎧",
    desc: "Soft, cozy vibes",
  },
  {
    value: MusicLoop.kawaiiPop,
    label: "Kawaii-Pop",
    icon: "🎠",
    desc: "Bubbly & bright",
  },
];

const UNBOXING_OPTIONS: { value: UnboxingType; icon: string; desc: string }[] =
  [
    {
      value: UnboxingType.polaroidStack,
      icon: "📸",
      desc: "Swipe through a Polaroid pile",
    },
    {
      value: UnboxingType.secretLocket,
      icon: "💗",
      desc: "Tap a heart locket to open",
    },
    {
      value: UnboxingType.cdStickerPeeler,
      icon: "💿",
      desc: "Peel stickers off a CD case",
    },
    {
      value: UnboxingType.fruitSoda,
      icon: "🍹",
      desc: "Pop bubbles from a soda screen",
    },
    {
      value: UnboxingType.openWhen,
      icon: "✉️",
      desc: "Locked until the right moment",
    },
    { value: UnboxingType.musicBox, icon: "🎵", desc: "Unwrap with a song" },
    {
      value: UnboxingType.strawberryJar,
      icon: "🪹",
      desc: "Floaty photos in a jar",
    },
    {
      value: UnboxingType.cloverField,
      icon: "🍀",
      desc: "Find the clover to open",
    },
  ];

// ─── Asset scroll bar (decorative) ──────────────────────────────────────────────────────
const ASSET_BAR = [
  "🍓",
  "🍋",
  "🍎",
  "🍇",
  "🍓",
  "⭐",
  "🎠",
  "💖",
  "🖳️",
  "🖼️",
  "📎",
  "🌸",
  "🌻",
  "🥝",
  "🍃",
  "✨",
];

function AssetScrollBar() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 overflow-x-auto"
      style={{
        background: "rgba(255,246,233,0.95)",
        borderTop: "2px solid #EADBC8",
      }}
      aria-label="Decorative asset bar"
    >
      <div className="flex items-center gap-4 px-4 py-2">
        {ASSET_BAR.map((emoji, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative static list
            key={i}
            className="text-2xl flex-shrink-0 select-none opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-150 cursor-default"
            aria-hidden="true"
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Step Indicator (StampCard-style dots) ────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div
      className="flex items-center justify-between gap-1 px-1"
      data-ocid="compose.step_indicator"
    >
      {STEP_LABELS.map((label, i) => (
        <button
          key={label}
          type="button"
          disabled
          className="flex-1 flex flex-col items-center gap-1 py-1"
          data-ocid={`compose.step_tab.${i + 1}`}
        >
          {/* StampCard-style dot */}
          <div
            className="relative inline-flex flex-col items-center"
            style={{
              transition: "transform 0.2s",
              transform: i === current ? "scale(1.15)" : "scale(1)",
            }}
          >
            <div
              className="w-9 h-9 flex items-center justify-center rounded-[8px] border-2"
              style={{
                background:
                  i === current
                    ? "#FFF6E9"
                    : i < current
                      ? "#EAF5E3"
                      : "#EADBC8",
                borderColor:
                  i === current
                    ? "#E85A5A"
                    : i < current
                      ? "#A8D672"
                      : "#C4A882",
                outline:
                  i === current ? "2px dashed rgba(232,90,90,0.25)" : "none",
                outlineOffset: "3px",
                transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                boxShadow:
                  i === current ? "0 2px 6px rgba(232,90,90,0.18)" : "none",
              }}
            >
              {i < current ? (
                <span className="text-xs text-[#3D7A4A] font-bold">✓</span>
              ) : (
                <span className="text-base leading-none">{STEP_STAMPS[i]}</span>
              )}
            </div>
            <span
              className="text-[9px] mt-0.5 font-body text-center leading-tight hidden sm:block"
              style={{
                color: i === current ? "#E85A5A" : "#7A5C4A",
                fontFamily: "Caveat, cursive",
              }}
            >
              {label.split(" ").slice(1).join(" ")}
            </span>
          </div>
          {/* connector line */}
          {i < STEP_LABELS.length - 1 && (
            <div
              className="absolute top-4 left-full h-0.5 flex-1"
              style={{
                background: i < current ? "#A8D672" : "#EADBC8",
                width: "100%",
              }}
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Photo Polaroid Thumb ─────────────────────────────────────────────────────────────────────
function PolaroidThumb({
  photo,
  index,
  onRemove,
  onFlipNoteChange,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  photo: UploadedPhoto;
  index: number;
  onRemove: (id: string) => void;
  onFlipNoteChange: (id: string, note: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const rot = index % 2 === 0 ? 1.5 : -1.5;

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: rot }}
      exit={{ scale: 0.6, opacity: 0 }}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      className="relative cursor-grab active:cursor-grabbing"
      data-ocid={`compose.photo_thumb.${index + 1}`}
    >
      <PolaroidFrame
        src={photo.previewUrl}
        alt={`Uploaded ${index + 1}`}
        className="w-[100px]"
      >
        <div className="w-full aspect-square bg-muted/40 flex items-center justify-center rounded-sm">
          <span className="text-2xl">🖼️</span>
        </div>
      </PolaroidFrame>

      {/* Flip note area */}
      <div className="absolute bottom-2 left-2 right-2">
        {!showNote ? (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="text-[9px] hover:text-primary transition-colors leading-tight w-full text-center"
            style={{ color: "#7A5C4A", fontFamily: "Caveat, cursive" }}
            data-ocid={`compose.add_flip_note.${index + 1}`}
          >
            {photo.flipNote ? "🌸 flip note" : "+ flip note"}
          </button>
        ) : (
          <Textarea
            value={photo.flipNote}
            onChange={(e) => onFlipNoteChange(photo.id, e.target.value)}
            onBlur={() => setShowNote(false)}
            placeholder="Secret note..."
            className="text-[9px] h-8 resize-none p-1 font-display rounded-sm border-primary/30 focus:border-primary"
            data-ocid={`compose.flip_note_input.${index + 1}`}
            autoFocus
          />
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(photo.id)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center hover:scale-110 transition-smooth shadow-sm z-10"
        aria-label="Remove photo"
        data-ocid={`compose.remove_photo.${index + 1}`}
      >
        ✕
      </button>

      {photo.flipNote && (
        <span
          className="absolute -bottom-0.5 -left-0.5 text-sm"
          title="Has secret note"
          aria-label="Has secret flip note"
        >
          🌸
        </span>
      )}
    </motion.div>
  );
}

// ─── Confetti Burst ───────────────────────────────────────────────────────────────────────────────
const CONFETTI_PIECES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  emoji: ["✨", "🌸", "⭐", "💫", "🎠", "💕"][i % 6],
  x: (i * 5.3) % 100,
  delay: (i * 0.13) % 0.5,
  size: 16 + ((i * 3) % 16),
}));

function ConfettiBurst() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {CONFETTI_PIECES.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ y: -20, x: `${piece.x}vw`, opacity: 0, scale: 0 }}
          animate={{ y: "110vh", opacity: [0, 1, 1, 0], scale: [0, 1, 0.8, 0] }}
          transition={{ duration: 2.5, delay: piece.delay, ease: "easeIn" }}
          style={{ position: "absolute", top: 0, fontSize: piece.size }}
        >
          {piece.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Step Section Title ───────────────────────────────────────────────────────────────────────
function StepTitle({ title }: { title: string }) {
  return (
    <h2
      className="font-display font-bold"
      style={{
        fontFamily: "Caveat, cursive",
        fontSize: "22px",
        color: "#3D2C1E",
        letterSpacing: "0.01em",
      }}
    >
      {title}
    </h2>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────────────────
export function ComposePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const createLetter = useCreateLetter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  // Step 0 – Photos + recipient
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recipientLink, setRecipientLink] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("to") ?? "";
  });

  // Step 1 – Note
  const [note, setNote] = useState("");
  const [secretNote, setSecretNote] = useState("");

  // Step 0 – Frame
  const [selectedFrame, setSelectedFrame] = useState(PHOTO_FRAME_OPTIONS[0].id);

  // Step 2 – Dress It Up
  const [selectedSeal, setSelectedSeal] = useState(SEAL_OPTIONS[0].id);
  const [unboxingType, setUnboxingType] = useState<UnboxingType>(
    UnboxingType.polaroidStack,
  );
  const [openWhenPreset, setOpenWhenPreset] = useState<string>("");
  const [openWhenCustom, setOpenWhenCustom] = useState<string>("");
  const [envelopeTexture, setEnvelopeTexture] = useState<EnvelopeTexture>(
    EnvelopeTexture.gingham,
  );
  const [musicLoop, setMusicLoop] = useState<MusicLoop | "none">("none");

  // Step 4 – Result
  const [sentLetterId, setSentLetterId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [envelopeFlying, setEnvelopeFlying] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, isLoading, navigate]);

  // ── Photo upload ──────────────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = 5 - photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      if (!toAdd.length) return;

      setUploading(true);
      const newPhotos: UploadedPhoto[] = await Promise.all(
        toAdd.map(async (file) => {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes);
          const previewUrl = URL.createObjectURL(file);
          return {
            blob,
            previewUrl,
            flipNote: "",
            id: `${Date.now()}-${Math.random()}`,
          };
        }),
      );
      setPhotos((prev) => [...prev, ...newPhotos]);
      setUploading(false);
    },
    [photos.length],
  );

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const updateFlipNote = useCallback((id: string, flipNote: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, flipNote } : p)),
    );
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragFromIndex === null || dragFromIndex === targetIndex) return;
      setPhotos((prev) => {
        const arr = [...prev];
        const [moved] = arr.splice(dragFromIndex, 1);
        arr.splice(targetIndex, 0, moved);
        return arr;
      });
      setDragFromIndex(null);
    },
    [dragFromIndex],
  );

  // ── Send ──────────────────────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    setEnvelopeFlying(true);
    await new Promise((r) => setTimeout(r, 600));

    const receiverLink = recipientLink.trim();
    let finalNote = note;

    if (unboxingType === UnboxingType.openWhen) {
      const label = openWhenCustom || openWhenPreset;
      if (label) finalNote = `[Open When: ${label}]\n${note}`;
    }

    let openWhenTime: bigint | undefined;
    if (unboxingType === UnboxingType.openWhen) {
      const label = openWhenCustom || openWhenPreset;
      if (label)
        openWhenTime = BigInt(Date.now() + 1000 * 3600 * 24 * 365) * 1_000_000n;
    }

    const photoFlipNotes = photos
      .map((p, i) => (p.flipNote ? `[Photo ${i + 1}]: ${p.flipNote}` : ""))
      .filter(Boolean)
      .join("\n");
    const combinedSecret = [secretNote, photoFlipNotes]
      .filter(Boolean)
      .join("\n---\n");

    const input: CreateLetterInput = {
      note: finalNote,
      envelopeTexture,
      receiverLink,
      secretNote: combinedSecret || undefined,
      openWhenTime,
      musicLoop: musicLoop !== "none" ? musicLoop : undefined,
      unboxingType,
      photos: photos.map((p) => ({ blob: p.blob })),
    };

    try {
      const id = await createLetter.mutateAsync(input);
      setSentLetterId(id);
      setShowConfetti(true);
      setStep(3);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch {
      setEnvelopeFlying(false);
    }
  }, [
    note,
    envelopeTexture,
    secretNote,
    musicLoop,
    unboxingType,
    photos,
    openWhenPreset,
    openWhenCustom,
    recipientLink,
    createLetter,
  ]);

  const shareUrl = sentLetterId
    ? `${window.location.origin}/letter/${sentLetterId}`
    : "";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  // ── Render guards ────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout>
        <div
          className="flex flex-col gap-4 max-w-xl mx-auto"
          data-ocid="compose.loading_state"
        >
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  const canGoNext = [
    recipientLink.trim().length > 0,
    note.trim().length > 0,
    true,
    false,
  ][step];

  return (
    <Layout>
      {showConfetti && <ConfettiBurst />}
      <AssetScrollBar />

      <div
        className="max-w-xl mx-auto flex flex-col gap-4 pb-24"
        data-ocid="compose.page"
      >
        {/* Header */}
        <div className="relative flex items-center gap-3 pt-2">
          <TapeStrip
            color="pink"
            width={180}
            angle={-4}
            className="top-1/2 left-0 -translate-y-1/2"
          />
          <motion.span
            className="text-3xl relative z-10"
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            💌
          </motion.span>
          <div className="relative z-10">
            <h1
              className="font-display font-bold text-2xl lowercase"
              style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
            >
              new vibemail
            </h1>
            <p className="font-body text-sm" style={{ color: "#7A5C4A" }}>
              design a letter for your bestie ✨
            </p>
          </div>
        </div>

        <StepIndicator current={step} />
        <ImageDivider variant="milkshake" className="my-1" />

        {/* ── STEP 0: PHOTOS ──────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-photos"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-4"
              data-ocid="compose.step_photos"
            >
              <div
                className="bg-[#FFF6E9] rounded-2xl border-2 border-[#A8D672]/40 p-5"
                style={{ boxShadow: "0 3px 14px rgba(168,214,114,0.18)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <StepTitle title="pick your photos 📸" />
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] rounded-full"
                  >
                    {photos.length}/5
                  </Badge>
                </div>

                {/* To: recipient field */}
                <div className="mb-4">
                  <label
                    htmlFor="compose-to"
                    className="text-xs font-body font-medium mb-1.5 flex items-center gap-1.5"
                    style={{ color: "#3D2C1E" }}
                  >
                    <span>📬</span>
                    <span>
                      to: (paste your bestie’s inbox link / principal ID)
                    </span>
                  </label>
                  <Input
                    id="compose-to"
                    value={recipientLink}
                    onChange={(e) => setRecipientLink(e.target.value)}
                    placeholder="e.g. xxxxx-xxxxx-…"
                    className="jumi-input font-mono text-xs border-[#A8D672]/50 focus:border-[#A8D672] bg-[#EAF5E3]/60"
                    data-ocid="compose.recipient_input"
                  />
                  <p
                    className="text-[10px] font-body mt-1"
                    style={{ color: "#A89078" }}
                  >
                    ask your bestie to share their inbox link from their profile
                    page ✨
                  </p>
                </div>

                {/* Upload zone */}
                {photos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                      "w-full border-2 border-dashed border-[#A8D672]/60 rounded-xl py-8 px-4 flex flex-col items-center gap-2",
                      "text-[#7A5C4A] hover:bg-[#EAF5E3]/60 hover:border-[#A8D672] transition-smooth",
                      uploading && "opacity-50 cursor-not-allowed",
                    )}
                    data-ocid="compose.photo_upload_button"
                  >
                    <span className="text-3xl">{uploading ? "⏳" : "🖼️"}</span>
                    <span className="text-sm font-body">
                      {uploading ? "uploading…" : "tap to add photos"}
                    </span>
                    <span className="text-xs" style={{ color: "#A89078" }}>
                      up to {5 - photos.length} more
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  data-ocid="compose.photo_file_input"
                />

                {photos.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    <AnimatePresence>
                      {photos.map((photo, i) => (
                        <PolaroidThumb
                          key={photo.id}
                          photo={photo}
                          index={i}
                          onRemove={removePhoto}
                          onFlipNoteChange={updateFlipNote}
                          onDragStart={setDragFromIndex}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {photos.length === 0 && (
                  <p
                    className="text-center text-xs mt-3 font-body"
                    style={{ color: "#A89078" }}
                    data-ocid="compose.photos_empty_state"
                  >
                    no photos yet — the more the merrier! 🌸
                  </p>
                )}
              </div>

              {/* Photo Frame Picker */}
              <div
                className="bg-[#FFF6E9] rounded-2xl border-2 border-[#F6E27F]/60 p-4"
                style={{ boxShadow: "0 2px 10px rgba(246,226,127,0.18)" }}
              >
                <p
                  className="text-xs font-body font-medium mb-3 flex items-center gap-1.5"
                  style={{ color: "#7A5C4A" }}
                >
                  <span>🖼️</span>
                  <span
                    style={{ fontFamily: "Caveat, cursive", fontSize: "14px" }}
                  >
                    photo frame
                  </span>
                </p>
                <div className="flex gap-3 flex-wrap">
                  {PHOTO_FRAME_OPTIONS.map((frame) => (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => setSelectedFrame(frame.id)}
                      data-ocid={`compose.frame_option.${frame.id}`}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-smooth w-20",
                        selectedFrame === frame.id
                          ? "border-[#A8D672] bg-[#EAF5E3] shadow-md scale-105"
                          : "border-[#EADBC8] hover:border-[#A8D672]/60 hover:bg-[#EAF5E3]/40",
                      )}
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted/40">
                        <img
                          src={frame.src}
                          alt={frame.label}
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                        {selectedFrame === frame.id && (
                          <span className="absolute top-0 right-0 text-[8px] bg-[#A8D672] text-white rounded px-0.5 font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[9px] font-body font-semibold text-center leading-tight"
                        style={{ color: "#3D2C1E" }}
                      >
                        {frame.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl border border-[#EADBC8] p-3 text-xs font-body flex items-start gap-2"
                style={{
                  background: "rgba(234,219,200,0.25)",
                  color: "#7A5C4A",
                }}
              >
                <span className="text-base flex-shrink-0">💡</span>
                <span>
                  drag photos to reorder. tap “flip note” on any photo to add a
                  secret message behind it!
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={!canGoNext}
                className="jumi-btn-primary w-full rounded-2xl py-3 font-display font-bold text-base disabled:opacity-50"
                data-ocid="compose.next_to_note_button"
              >
                next: write your note →
              </button>
            </motion.div>
          )}

          {/* ── STEP 1: WRITE ─────────────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step-write"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-4"
              data-ocid="compose.step_write"
            >
              {/* PouchContainer preview of letter contents */}
              {photos.length > 0 && (
                <PouchContainer title="letter contents">
                  <div className="flex gap-2 flex-wrap justify-center px-4 pb-4">
                    {photos.slice(0, 3).map((photo, i) => (
                      <PolaroidFrame
                        key={photo.id}
                        src={photo.previewUrl}
                        alt={`Photo ${i + 1}`}
                        rotation={i % 2 === 0 ? -3 : 3}
                        className="w-20"
                      />
                    ))}
                    {photos.length > 3 && (
                      <div
                        className="w-20 h-24 rounded-[4px] flex items-center justify-center"
                        style={{
                          background: "rgba(168,214,114,0.25)",
                          border: "1px solid #A8D672",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Caveat, cursive",
                            color: "#3D7A4A",
                            fontSize: "14px",
                          }}
                        >
                          +{photos.length - 3} more
                        </span>
                      </div>
                    )}
                  </div>
                </PouchContainer>
              )}

              {/* Note card — slightly rotated, lined paper, TapeStrip */}
              <div className="relative" style={{ transform: "rotate(-2deg)" }}>
                <TapeStrip
                  color="pink"
                  width="60%"
                  angle={-4}
                  className="-top-2 left-1/2 -translate-x-1/2"
                />
                <div
                  className="bg-[#FFF6E9] rounded-2xl border-2 border-[#E85A5A]/20 p-5"
                  style={{ boxShadow: "0 4px 16px rgba(232,90,90,0.12)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <StepTitle title="write your note ✍️" />
                  </div>

                  {/* Gel pen textarea with lined paper */}
                  <div className="rounded-xl overflow-hidden border-2 border-[#E85A5A]/20 relative">
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(transparent, transparent 27px, oklch(var(--border) / 0.4) 28px)",
                        backgroundSize: "100% 28px",
                      }}
                    />
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="hey bestie, just wanted you to know…"
                      className="relative min-h-[180px] resize-none border-none bg-transparent text-base leading-[28px] pt-1 focus-visible:ring-0 focus-visible:ring-offset-0 font-display text-accent"
                      style={{
                        fontSize: "17px",
                        lineHeight: "28px",
                        padding: "6px 12px",
                        fontFamily: "Caveat, cursive",
                      }}
                      data-ocid="compose.note_textarea"
                    />
                  </div>

                  <p
                    className="text-xs mt-2 font-body"
                    style={{ color: "#A89078" }}
                  >
                    {note.length} characters
                  </p>

                  {/* Secret note */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🤫</span>
                      <span
                        className="text-sm font-body font-medium"
                        style={{ color: "#3D2C1E" }}
                      >
                        add a secret behind the letter
                      </span>
                    </div>
                    <Textarea
                      value={secretNote}
                      onChange={(e) => setSecretNote(e.target.value)}
                      placeholder="only they’ll see this when they flip it over…"
                      className="min-h-[72px] resize-none text-sm border-dashed border-[#E85A5A]/30 font-display"
                      style={{ fontFamily: "Caveat, cursive" }}
                      data-ocid="compose.secret_note_textarea"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="jumi-btn-secondary flex-1 rounded-2xl py-2"
                  data-ocid="compose.back_to_photos_button"
                >
                  ← back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canGoNext}
                  className="jumi-btn-primary flex-[2] rounded-2xl py-2 font-display font-bold disabled:opacity-50"
                  data-ocid="compose.next_to_dress_button"
                >
                  next: dress it up &#8594;
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: DRESS IT UP ────────────────────────────────────────────── */}

          {/* ── STEP 3: DRESS IT UP ────────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step-dress"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col gap-4"
              data-ocid="compose.step_dress"
            >
              {/* Unboxing type — FruitCard tiles */}
              <div
                className="bg-[#FFF6E9] rounded-2xl border-2 border-[#F6E27F]/60 p-5"
                style={{ boxShadow: "0 3px 14px rgba(246,226,127,0.2)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <StepTitle title="dress it up 🎁" />
                </div>
                <p
                  className="text-xs font-body mb-3"
                  style={{ color: "#7A5C4A", fontFamily: "Caveat, cursive" }}
                >
                  pick an unboxing style 🎁
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {UNBOXING_OPTIONS.map(({ value, icon, desc }, i) => (
                    <FruitCard
                      key={value}
                      fruitEmoji={icon}
                      rotation={i % 2 === 0 ? 2 : -2}
                      cycle={i % 4}
                      onClick={() => setUnboxingType(value)}
                      className={cn(
                        "transition-all",
                        unboxingType === value
                          ? "ring-2 ring-[#E85A5A] ring-offset-1 scale-105"
                          : "opacity-80 hover:opacity-100",
                      )}
                    >
                      <p
                        className="text-xs font-display font-bold leading-tight"
                        style={{ color: "#3D2C1E" }}
                      >
                        {UNBOXING_LABELS[value].split(" ").slice(1).join(" ")}
                      </p>
                      <p
                        className="text-[10px] font-body mt-0.5 leading-tight"
                        style={{ color: "#7A5C4A" }}
                      >
                        {desc}
                      </p>
                      {unboxingType === value && (
                        <span
                          className="text-[10px] font-bold mt-1 block"
                          style={{ color: "#E85A5A" }}
                        >
                          ✓ selected
                        </span>
                      )}
                    </FruitCard>
                  ))}
                </div>

                {/* Open When options */}
                <AnimatePresence>
                  {unboxingType === UnboxingType.openWhen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <p
                        className="text-xs font-body font-medium mb-2"
                        style={{ color: "#3D2C1E" }}
                      >
                        ✉️ choose a preset or write your own:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {OPEN_WHEN_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setOpenWhenPreset(preset);
                              setOpenWhenCustom("");
                            }}
                            className={cn(
                              "text-left text-xs py-2 px-3 rounded-lg border transition-smooth font-body",
                              openWhenPreset === preset
                                ? "border-[#A8D672] bg-[#EAF5E3] text-[#3D2C1E]"
                                : "border-[#EADBC8] text-[#7A5C4A] hover:border-[#A8D672]/60 hover:bg-[#EAF5E3]/40",
                            )}
                            data-ocid={`compose.open_when_preset.${OPEN_WHEN_PRESETS.indexOf(preset) + 1}`}
                          >
                            {preset}
                          </button>
                        ))}
                        <input
                          type="text"
                          value={openWhenCustom}
                          onChange={(e) => {
                            setOpenWhenCustom(e.target.value);
                            setOpenWhenPreset("");
                          }}
                          placeholder="or write your own… ✍️"
                          className="text-xs py-2 px-3 rounded-lg border border-dashed border-[#EADBC8] bg-transparent focus:outline-none focus:border-[#A8D672] font-body"
                          style={{ color: "#3D2C1E" }}
                          data-ocid="compose.open_when_custom_input"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Envelope Customisation — StampCard components */}
              <div
                className="bg-[#FFF6E9] rounded-2xl border-2 border-[#F7C6C7]/50 p-5"
                style={{ boxShadow: "0 3px 14px rgba(247,198,199,0.15)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💌</span>
                  <h3
                    className="font-display font-bold text-base"
                    style={{
                      color: "#3D2C1E",
                      fontFamily: "Caveat, cursive",
                      fontSize: "18px",
                    }}
                  >
                    envelope style
                  </h3>
                </div>

                {/* Live envelope preview */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-52 h-36">
                    <img
                      src="/assets/envelopes/envelope-sealed.png"
                      alt="Envelope preview"
                      className="w-full h-full object-contain"
                    />

                    <img
                      src={
                        SEAL_OPTIONS.find((s) => s.id === selectedSeal)?.src ??
                        SEAL_OPTIONS[0].src
                      }
                      alt="Selected seal"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 object-contain"
                    />
                  </div>
                </div>

                {/* Texture picker */}
                <p
                  className="text-xs font-body mb-2"
                  style={{ color: "#7A5C4A", fontFamily: "Caveat, cursive" }}
                >
                  🎨 texture
                </p>
                <div className="flex gap-2 mb-4">
                  {ENVELOPE_OPTIONS.map(
                    ({ value, label, icon, className: cls }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setEnvelopeTexture(value)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-smooth",
                          cls,
                          envelopeTexture === value
                            ? "border-[#E85A5A] scale-105 shadow-md"
                            : "border-transparent hover:border-[#E85A5A]/30",
                        )}
                        data-ocid={`compose.envelope_option.${value}`}
                      >
                        <span className="text-xl">{icon}</span>
                        <span
                          className="text-[9px] font-body font-medium text-center leading-tight"
                          style={{ color: "#3D2C1E" }}
                        >
                          {label}
                        </span>
                        {envelopeTexture === value && (
                          <span
                            className="text-[8px] font-bold"
                            style={{ color: "#E85A5A" }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ),
                  )}
                </div>

                {/* Wax seal picker */}
                <p
                  className="text-xs font-body mb-2"
                  style={{ color: "#7A5C4A", fontFamily: "Caveat, cursive" }}
                >
                  🧸 wax seal
                </p>
                <div className="flex gap-3">
                  {SEAL_OPTIONS.map((seal) => (
                    <button
                      key={seal.id}
                      type="button"
                      onClick={() => setSelectedSeal(seal.id)}
                      data-ocid={`compose.seal_option.${seal.id}`}
                      className={cn(
                        "relative w-16 h-16 rounded-full border-2 overflow-hidden transition-smooth bg-[#EADBC8]/30",
                        selectedSeal === seal.id
                          ? "border-[#E85A5A] scale-110 shadow-md"
                          : "border-[#EADBC8] hover:border-[#E85A5A]/40",
                      )}
                    >
                      <img
                        src={seal.src}
                        alt={seal.label}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                  <div className="flex flex-col justify-center ml-1">
                    <p
                      className="text-xs font-body font-medium"
                      style={{ color: "#3D2C1E" }}
                    >
                      {SEAL_OPTIONS.find((s) => s.id === selectedSeal)?.label}
                    </p>
                    <p
                      className="text-[10px] font-body"
                      style={{ color: "#A89078" }}
                    >
                      wax seal
                    </p>
                  </div>
                </div>
              </div>

              {/* Music loop */}
              <div
                className="bg-[#EAF5E3] rounded-2xl border-2 border-[#A8D672]/40 p-5"
                style={{ boxShadow: "0 3px 14px rgba(168,214,114,0.15)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎵</span>
                  <h3
                    className="font-display font-bold text-base"
                    style={{
                      color: "#3D2C1E",
                      fontFamily: "Caveat, cursive",
                      fontSize: "18px",
                    }}
                  >
                    music loop
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {MUSIC_OPTIONS.map(({ value, label, icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMusicLoop(value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-smooth",
                        musicLoop === value
                          ? "border-[#A8D672] bg-[#EAF5E3]"
                          : "border-[#EADBC8] hover:border-[#A8D672]/50 hover:bg-[#EAF5E3]/50",
                      )}
                      data-ocid={`compose.music_option.${value}`}
                    >
                      <span className="text-2xl">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-display font-bold"
                          style={{ color: "#3D2C1E" }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-[10px] font-body"
                          style={{ color: "#7A5C4A" }}
                        >
                          {desc}
                        </p>
                      </div>
                      {musicLoop === value && (
                        <span style={{ color: "#3D7A4A" }} className="text-sm">
                          ♫
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="jumi-btn-secondary flex-1 rounded-2xl py-2"
                  data-ocid="compose.back_to_write_button"
                >
                  ← back
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={createLetter.isPending || envelopeFlying}
                  className="jumi-btn-primary flex-[2] rounded-2xl py-3 font-display font-bold text-base disabled:opacity-50"
                  data-ocid="compose.send_button"
                >
                  {createLetter.isPending || envelopeFlying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin text-base">💌</span>
                      sending…
                    </span>
                  ) : (
                    "send it! 💌"
                  )}
                </button>
              </div>

              {createLetter.isError && (
                <p
                  className="text-sm text-destructive text-center font-body"
                  data-ocid="compose.send_error_state"
                >
                  oops! something went wrong. try again 💔
                </p>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: SUCCESS ─────────────────────────────────────────────── */}
          {step === 3 && sentLetterId && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-4"
              data-ocid="compose.step_success"
            >
              {/* PouchContainer letter preview with TapeStrip */}
              <PouchContainer title="">
                <div className="relative">
                  <TapeStrip
                    color="yellow"
                    width="70%"
                    angle={-3}
                    className="top-2 left-1/2 -translate-x-1/2 z-10"
                  />
                  <div className="flex flex-col items-center py-6 px-4 gap-3">
                    <motion.div
                      className="text-7xl inline-block"
                      animate={{
                        rotate: [0, -5, 5, -3, 0],
                        y: [0, -8, 0, -4, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 1,
                      }}
                    >
                      💌
                    </motion.div>
                    <h2
                      className="font-display font-bold text-center"
                      style={{
                        fontFamily: "Caveat, cursive",
                        fontSize: "28px",
                        color: "#3D2C1E",
                      }}
                    >
                      your letter is flying ✨
                    </h2>
                    <p
                      className="text-sm font-body text-center"
                      style={{ color: "#7A5C4A" }}
                    >
                      share this link with your bestie so they can open it 🌸
                    </p>
                  </div>
                </div>
              </PouchContainer>

              <div
                className="bg-[#FFF6E9] rounded-2xl border-2 border-[#A8D672]/40 p-6"
                style={{ boxShadow: "0 3px 14px rgba(168,214,114,0.18)" }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-stretch gap-2"
                >
                  <div
                    className="flex-1 rounded-xl px-3 py-2.5 text-xs font-mono border text-left overflow-hidden"
                    style={{
                      background: "rgba(234,219,200,0.4)",
                      borderColor: "#EADBC8",
                      color: "#7A5C4A",
                      wordBreak: "break-all",
                    }}
                    data-ocid="compose.share_link"
                  >
                    {shareUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      "rounded-xl flex-shrink-0 font-display px-4 py-2 text-sm font-bold transition-smooth",
                      copied
                        ? "bg-[#EAF5E3] border-2 border-[#A8D672] text-[#3D7A4A]"
                        : "jumi-btn-primary",
                    )}
                    data-ocid="compose.copy_link_button"
                  >
                    {copied ? "copied! 🌸" : "copy 📋"}
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-2 mt-4"
                >
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/sent" })}
                    className="jumi-btn-secondary flex-1 rounded-2xl py-2 font-body text-sm"
                    data-ocid="compose.view_sent_button"
                  >
                    view sent letters 📬
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(0);
                      setPhotos([]);
                      setNote("");
                      setSecretNote("");
                      setRecipientLink("");
                      setUnboxingType(UnboxingType.polaroidStack);
                      setEnvelopeTexture(EnvelopeTexture.gingham);
                      setMusicLoop("none");

                      setSentLetterId(null);
                      setEnvelopeFlying(false);
                    }}
                    className="jumi-btn-primary flex-1 rounded-2xl py-2 font-body text-sm"
                    data-ocid="compose.send_another_button"
                  >
                    send another 💌
                  </button>
                </motion.div>
              </div>

              {/* Summary badges */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-wrap gap-2 justify-center"
                data-ocid="compose.success_summary"
              >
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-body"
                >
                  {photos.length} 📷 photo{photos.length !== 1 ? "s" : ""}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-body"
                >
                  {UNBOXING_LABELS[unboxingType]}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-body"
                >
                  {
                    ENVELOPE_OPTIONS.find((e) => e.value === envelopeTexture)
                      ?.icon
                  }{" "}
                  {
                    ENVELOPE_OPTIONS.find((e) => e.value === envelopeTexture)
                      ?.label
                  }
                </Badge>
                {musicLoop !== "none" && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-xs font-body"
                  >
                    {MUSIC_OPTIONS.find((m) => m.value === musicLoop)?.icon}{" "}
                    music
                  </Badge>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
