import { ImageDivider } from "@/components/ImageDivider";
import {
  PolaroidFrame,
  StampCard,
  TapeStrip,
} from "@/components/JumiComponents";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLetter, useMarkRead } from "../hooks/use-backend";
import {
  EnvelopeTexture,
  MusicLoop,
  PHOTO_FRAME_OPTIONS,
  UnboxingType,
} from "../types";
import type { Letter, Photo } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPhotoUrl(photo: Photo): string {
  try {
    return photo.blob.getDirectURL();
  } catch {
    return "/assets/images/placeholder.svg";
  }
}

const RAND_ROTS = Array.from({ length: 20 }, () => (Math.random() - 0.5) * 16);
const DOT_KEYS = [
  "dot-a",
  "dot-b",
  "dot-c",
  "dot-d",
  "dot-e",
  "dot-f",
  "dot-g",
  "dot-h",
];

// ─── Music Player ─────────────────────────────────────────────────────────────

function playChimeTone(ctx: AudioContext, freq: number, startAt: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.12, startAt + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + 1.4);
  osc.start(startAt);
  osc.stop(startAt + 1.5);
}

function startAmbientLoop(ctx: AudioContext): () => void {
  const LOFI_NOTES = [261.63, 329.63, 392, 523.25, 440, 349.23];
  let active = true;
  let timeout: ReturnType<typeof setTimeout>;
  function scheduleNext(i: number) {
    if (!active) return;
    playChimeTone(ctx, LOFI_NOTES[i % LOFI_NOTES.length], ctx.currentTime);
    timeout = setTimeout(() => scheduleNext(i + 1), 700 + (i % 3) * 200);
  }
  scheduleNext(0);
  return () => {
    active = false;
    clearTimeout(timeout);
  };
}

function MusicPlayer({ loop }: { loop: MusicLoop }) {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const label = loop === MusicLoop.lofi ? "🎵 Lo-fi Chill" : "🎀 Kawaii Pop";

  const toggle = useCallback(() => {
    if (playing) {
      stopRef.current?.();
      stopRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setPlaying(false);
    } else {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      stopRef.current = startAmbientLoop(ctx);
      setPlaying(true);
    }
  }, [playing]);

  useEffect(() => {
    return () => {
      stopRef.current?.();
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      data-ocid="unbox.music_toggle"
      aria-label={playing ? "Pause music" : "Play music"}
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-card/80 backdrop-blur-md border border-border sticker-shadow transition-smooth text-sm font-body",
        playing && "bg-accent/20 border-accent/40",
      )}
    >
      <span className={cn(playing && "animate-bounce")}>
        {playing ? "⏸" : "▶"}
      </span>
      <span className="text-xs">{label}</span>
    </button>
  );
}

// ─── Envelope Intro ───────────────────────────────────────────────────────────

const TEXTURE_BG: Record<EnvelopeTexture, string> = {
  [EnvelopeTexture.gingham]: "from-secondary/40 to-secondary/10",
  [EnvelopeTexture.frosted]: "from-card/60 to-background/80",
  [EnvelopeTexture.holographic]: "holographic-shimmer",
};

const TEXTURE_BORDER: Record<EnvelopeTexture, string> = {
  [EnvelopeTexture.gingham]: "border-secondary",
  [EnvelopeTexture.frosted]: "border-white/40",
  [EnvelopeTexture.holographic]: "border-accent/60",
};

function EnvelopeIntro({
  letter,
  onOpen,
}: { letter: Letter; onOpen: () => void }) {
  const photoCount = letter.photos.length;
  const [opened, setOpened] = useState(false);

  const handleOpen = () => {
    setOpened(true);
    setTimeout(onOpen, 700);
  };

  const INTRO_SEALS = [
    "/assets/seals/seal-bow.png",
    "/assets/seals/seal-cloud.png",
  ];
  let hash = 0;
  for (let i = 0; i < letter.id.length; i++)
    hash = (hash * 31 + letter.id.charCodeAt(i)) | 0;
  const seal = INTRO_SEALS[Math.abs(hash + 1) % INTRO_SEALS.length];

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen gap-8 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ y: -120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={opened ? { scale: 1.05 } : { y: [0, -10, 0] }}
          transition={
            opened
              ? { duration: 0.3 }
              : {
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: "easeInOut",
                }
          }
          className={cn(
            "relative w-72 h-52 rounded-2xl border-2 flex items-center justify-center overflow-visible",
            `bg-gradient-to-br ${TEXTURE_BG[letter.envelopeTexture]}`,
            TEXTURE_BORDER[letter.envelopeTexture],
          )}
          data-ocid="unbox.envelope_card"
        >
          {/* Real envelope image */}
          <AnimatePresence mode="wait">
            {!opened ? (
              <motion.img
                key="sealed"
                src="/assets/envelopes/envelope-sealed.png"
                alt="Sealed envelope"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
              />
            ) : (
              <motion.img
                key="open"
                src="/assets/envelopes/envelope-open.png"
                alt="Open envelope"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          {/* Texture gradient overlay */}
          <div
            className="absolute inset-x-0 top-0 h-16 border-b border-current/10 pointer-events-none"
            style={{
              clipPath: "polygon(0 0, 50% 80%, 100% 0)",
              background: "oklch(var(--accent) / 0.08)",
            }}
          />

          {/* Wax seal — breaks on open */}
          <motion.img
            src={seal}
            alt="Wax seal"
            aria-hidden="true"
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 object-contain z-20"
            animate={
              opened
                ? { scale: 0, opacity: 0, rotate: 45 }
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{ duration: 0.4, ease: "backIn" }}
          />

          {letter.musicLoop && (
            <div className="absolute bottom-8 right-3 text-lg z-10">🎵</div>
          )}
          {letter.openWhenTime && (
            <div className="absolute bottom-8 left-3 text-lg z-10">⏰</div>
          )}
        </motion.div>

        <div className="text-center max-w-xs">
          <p className="text-muted-foreground font-body text-sm">
            You received a VibeMail
          </p>
          <p className="text-foreground font-display font-semibold text-lg mt-1 leading-snug">
            {letter.note.length > 60
              ? `${letter.note.slice(0, 57)}…`
              : letter.note}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={handleOpen}
          disabled={opened}
          data-ocid="unbox.open_button"
          className="px-10 py-6 text-lg rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold shadow-xl accent-glow"
        >
          {opened ? "✨ Opening…" : "✨ Open Your Letter"}
        </Button>
      </motion.div>

      <motion.p
        className="text-xs text-muted-foreground font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {photoCount} {photoCount !== 1 ? "memories" : "memory"} inside
      </motion.p>
    </motion.div>
  );
}

// ─── Framed Photo Helper ─────────────────────────────────────────────────────

const FramedPhoto = ({
  src,
  alt,
  frameId,
  isDeveloped,
}: {
  src: string;
  alt: string;
  frameId?: string;
  isDeveloped: boolean;
}) => {
  const frame = PHOTO_FRAME_OPTIONS.find((f) => f.id === frameId);
  const photoClass = cn(
    "w-full h-full object-cover transition-all duration-700",
    !isDeveloped && "grayscale blur-sm brightness-75",
  );
  if (!frame || frame.id === "polaroid-white") {
    return <img src={src} alt={alt} className={photoClass} />;
  }
  const overlayStyle: React.CSSProperties = { mixBlendMode: "multiply" };
  return (
    <div className="relative w-full h-full">
      <img src={src} alt={alt} className={photoClass} />
      <img
        src={frame.src}
        alt={frame.label}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={overlayStyle}
      />
    </div>
  );
};

// ─── Polaroid Stack ───────────────────────────────────────────────────────────

function PolaroidStack({
  photos,
  secretNote,
  frameId,
}: { photos: Photo[]; secretNote?: string; frameId?: string }) {
  const [current, setCurrent] = useState(0);
  const [developed, setDeveloped] = useState<boolean[]>(
    photos.map(() => false),
  );
  const [flipped, setFlipped] = useState<boolean[]>(photos.map(() => false));
  const [shaking, setShaking] = useState(false);

  // Extract per-photo flip notes from combined secretNote
  const parseFlipNotes = (note: string | undefined): string[] => {
    if (!note) return photos.map(() => "");
    return photos.map((_, i) => {
      const match = note.match(new RegExp(`\\[Photo ${i + 1}\\]: ([^\\n]+)`));
      return match ? match[1] : "";
    });
  };
  const flipNotes = parseFlipNotes(secretNote);
  // Overall letter secret (first section before ---)
  const letterSecret =
    secretNote
      ?.split("\n---\n")[0]
      ?.replace(/\[Photo \d+\]: [^\n]+\n?/g, "")
      .trim() || "";

  const developCurrent = useCallback((idx: number) => {
    setShaking(true);
    setTimeout(() => {
      setDeveloped((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setShaking(false);
    }, 600);
  }, []);

  useEffect(() => {
    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total =
        Math.abs(acc.x ?? 0) + Math.abs(acc.y ?? 0) + Math.abs(acc.z ?? 0);
      if (total > 30) developCurrent(current);
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [developCurrent, current]);

  const photo = photos[current];
  const isDeveloped = developed[current];
  const isFlipped = flipped[current];

  const toggleFlip = () =>
    setFlipped((prev) => {
      const next = [...prev];
      next[current] = !next[current];
      return next;
    });

  return (
    <div className="flex flex-col items-center gap-6 p-6 min-h-screen justify-center">
      {/* Dot nav */}
      <div className="flex gap-2">
        {photos.map((_, i) => (
          <button
            key={DOT_KEYS[i] ?? `dot-${i}`}
            type="button"
            onClick={() => setCurrent(i)}
            data-ocid={`unbox.polaroid_dot.${i + 1}`}
            aria-label={`Go to memory ${i + 1}`}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-smooth",
              i === current ? "bg-accent scale-125" : "bg-muted-foreground/40",
            )}
          />
        ))}
      </div>

      {/* 3D Flip card */}
      <div style={{ perspective: "1000px" }}>
        <motion.div
          animate={shaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.5 }}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            width: "18rem",
          }}
        >
          {/* Front */}
          <div
            className="bg-white rounded-sm p-3 pb-14 sticker-shadow"
            style={{
              backfaceVisibility: "hidden",
              rotate: `${RAND_ROTS[current]}deg`,
            }}
          >
            <div className="w-full aspect-square bg-muted overflow-hidden rounded-sm relative">
              <FramedPhoto
                src={getPhotoUrl(photo)}
                alt={
                  isDeveloped
                    ? `Memory ${current + 1}`
                    : "Undeveloped film — shake to reveal"
                }
                frameId={frameId}
                isDeveloped={isDeveloped}
              />
              {!isDeveloped && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl opacity-60">📷</span>
                </div>
              )}
            </div>
            <p className="text-center font-display text-sm text-foreground/60 mt-3 italic">
              {isDeveloped
                ? `${current + 1} / ${photos.length}`
                : "shake to develop ✨"}
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-white rounded-sm p-6 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              rotate: `${RAND_ROTS[current]}deg`,
            }}
          >
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2 font-display">
                💕 secret note
              </p>
              <p className="font-display text-base text-foreground leading-relaxed italic">
                {flipNotes[current] || letterSecret || "No secret note"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {!isDeveloped && (
          <Button
            onClick={() => developCurrent(current)}
            data-ocid="unbox.shake_button"
            className="rounded-full bg-primary text-primary-foreground font-display"
          >
            📸 Shake to Develop!
          </Button>
        )}
        {isDeveloped && (flipNotes[current] || letterSecret) && (
          <Button
            variant="outline"
            onClick={toggleFlip}
            data-ocid="unbox.flip_button"
            className="rounded-full font-display border-accent/40 text-accent"
          >
            {isFlipped ? "↩ Flip Back" : "🔄 Secret Note"}
          </Button>
        )}
      </div>

      {/* Prev / Next */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          data-ocid="unbox.polaroid_prev"
          className="rounded-full w-12 h-12 p-0 text-xl"
          aria-label="Previous"
        >
          ←
        </Button>
        <span className="font-body text-sm text-muted-foreground">
          {current + 1} / {photos.length}
        </span>
        <Button
          variant="ghost"
          onClick={() => setCurrent((c) => Math.min(photos.length - 1, c + 1))}
          disabled={current === photos.length - 1}
          data-ocid="unbox.polaroid_next"
          className="rounded-full w-12 h-12 p-0 text-xl"
          aria-label="Next"
        >
          →
        </Button>
      </div>
    </div>
  );
}

// ─── Secret Locket ────────────────────────────────────────────────────────────

const BLOB_KEYS = ["blob-0", "blob-1", "blob-2", "blob-3", "blob-4"];

function SecretLocket({ photos }: { photos: Photo[] }) {
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
      {/* Ambient blobs */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {BLOB_KEYS.map((blobKey, i) => (
          <motion.div
            key={blobKey}
            className="absolute rounded-full bg-accent/10"
            style={{
              width: 80 + i * 50,
              height: 80 + i * 50,
              left: `${12 + i * 16}%`,
              top: `${15 + (i % 3) * 22}%`,
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 3 + i,
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {!opened ? (
        <motion.div className="flex flex-col items-center gap-6 z-10">
          <p className="font-display text-muted-foreground text-sm">
            tap to open
          </p>
          <motion.button
            type="button"
            onClick={() => setOpened(true)}
            data-ocid="unbox.locket_button"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            whileTap={{ scale: 0.85 }}
            aria-label="Open the locket"
            className="relative flex items-center justify-center cursor-pointer"
          >
            <img
              src="/assets/charms/locket-closed.jpg"
              alt="Closed locket"
              className="w-52 h-52 object-contain rounded-full"
              style={{ mixBlendMode: "multiply" }}
            />
            {/* subtle pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.65 0.18 20 / 0.25) 0%, transparent 70%)",
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.button>
          <p className="font-display font-semibold text-foreground text-xl">
            Secret Locket
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="relative z-10 flex flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Open locket image */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <img
              src="/assets/charms/locket-open.jpg"
              alt="Open locket"
              className="w-52 h-52 object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          </motion.div>
          <div className="flex flex-wrap gap-4 justify-center max-w-lg">
            {photos.map((locketPhoto, i) => (
              <motion.button
                key={`locket-${locketPhoto.blob.getDirectURL().slice(-8)}-${i}`}
                type="button"
                onClick={() => setExpanded(i)}
                data-ocid={`unbox.locket_photo.${i + 1}`}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: (i % 2 === 0 ? -1 : 1) * 60,
                  y: -40,
                }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 160 }}
                whileHover={{ scale: 1.08 }}
                aria-label={`Memory ${i + 1}`}
                className="w-28 h-28 rounded-2xl overflow-hidden sticker-shadow border-2 border-accent/30 cursor-pointer"
                style={{ rotate: `${RAND_ROTS[i + 5]}deg` }}
              >
                <img
                  src={getPhotoUrl(locketPhoto)}
                  alt={`Memory ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
            data-ocid="unbox.locket_fullscreen"
          >
            <motion.img
              src={getPhotoUrl(photos[expanded])}
              alt={`Memory ${expanded + 1} expanded`}
              className="max-w-full max-h-full rounded-2xl sticker-shadow"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CD Sticker Peeler ────────────────────────────────────────────────────────

const CD_STICKER_IMAGES = [
  { src: "/assets/stickers/fruit-hearts.jpg", label: "Fruit Hearts" },
  { src: "/assets/stickers/kawaii-stars.jpg", label: "Kawaii Stars" },
  { src: "/assets/stickers/critters.jpg", label: "Critters" },
  { src: "/assets/stickers/paper-stars.jpg", label: "Paper Stars" },
] as const;

const STICKER_POSITIONS: React.CSSProperties[] = [
  { top: "10%", left: "8%" },
  { top: "8%", right: "10%" },
  { bottom: "12%", left: "6%" },
  { bottom: "10%", right: "8%" },
];

function CDStickerPeeler({ photos }: { photos: Photo[] }) {
  const [peeled, setPeeled] = useState<boolean[]>(
    CD_STICKER_IMAGES.map(() => false),
  );
  const [expanded, setExpanded] = useState<number | null>(null);
  const allPeeled = peeled.every(Boolean);
  const remaining = peeled.filter((p) => !p).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      <p className="font-display text-muted-foreground text-sm">
        {allPeeled ? "🎉 All stickers peeled!" : `Peel ${remaining} more…`}
      </p>

      <div className="relative w-72 h-72">
        <div className="absolute inset-0 rounded-2xl holographic-shimmer border-4 border-accent/40 sticker-shadow overflow-hidden flex items-center justify-center">
          {allPeeled ? (
            <motion.div
              className="grid grid-cols-2 gap-2 p-4 w-full h-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {photos.slice(0, 4).map((cdPhoto, i) => {
                const cdUrl = getPhotoUrl(cdPhoto);
                return (
                  <button
                    key={cdUrl}
                    type="button"
                    onClick={() => setExpanded(i)}
                    data-ocid={`unbox.cd_photo.${i + 1}`}
                    aria-label={`Memory ${i + 1}`}
                    className="rounded-xl overflow-hidden sticker-shadow cursor-pointer hover:scale-105 transition-smooth"
                  >
                    <img
                      src={cdUrl}
                      alt={`Memory ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-6xl opacity-30">💿</div>
          )}
        </div>

        {CD_STICKER_IMAGES.map((sticker, stickerIdx) => (
          <AnimatePresence key={sticker.label}>
            {!peeled[stickerIdx] && (
              <motion.button
                type="button"
                onClick={() =>
                  setPeeled((prev) => {
                    const next = [...prev];
                    next[stickerIdx] = true;
                    return next;
                  })
                }
                data-ocid={`unbox.cd_sticker.${stickerIdx + 1}`}
                exit={{ rotateX: 90, opacity: 0, scale: 0.5, y: -20 }}
                transition={{ duration: 0.4 }}
                aria-label={`Peel sticker ${stickerIdx + 1}`}
                className="absolute w-14 h-14 rounded-xl overflow-hidden border-2 border-accent/50 sticker-shadow cursor-pointer hover:scale-110 transition-smooth z-10 bg-card"
                style={STICKER_POSITIONS[stickerIdx]}
              >
                <img
                  src={sticker.src}
                  alt={sticker.label}
                  className="sticker-img w-full h-full"
                />
              </motion.button>
            )}
          </AnimatePresence>
        ))}
      </div>

      <div className="flex gap-2">
        {CD_STICKER_IMAGES.map((sticker) => (
          <div
            key={sticker.label}
            className={cn(
              "w-3 h-3 rounded-full transition-smooth",
              peeled[CD_STICKER_IMAGES.indexOf(sticker)]
                ? "bg-accent"
                : "bg-muted-foreground/30",
            )}
          />
        ))}
      </div>

      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
            data-ocid="unbox.cd_fullscreen"
          >
            <motion.img
              src={getPhotoUrl(photos[expanded])}
              alt={`Memory ${expanded + 1} expanded`}
              className="max-w-full max-h-full rounded-2xl sticker-shadow"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Fruit Soda ───────────────────────────────────────────────────────────────

interface SodaBubble {
  id: number;
  photoIndex: number;
  x: number;
  size: number;
  speed: number;
  popped: boolean;
}

const BG_BUBBLE_KEYS = Array.from({ length: 16 }, (_, i) => `bg-bubble-${i}`);

function FruitSoda({ photos }: { photos: Photo[] }) {
  const [bubbles, setBubbles] = useState<SodaBubble[]>(() =>
    photos.map((_, i) => ({
      id: i,
      photoIndex: i,
      x: 8 + (i / Math.max(photos.length - 1, 1)) * 78,
      size: 80 + (i % 3) * 30,
      speed: 8 + (i % 4) * 2,
      popped: false,
    })),
  );
  const [expanded, setExpanded] = useState<number | null>(null);

  const popBubble = (id: number, photoIndex: number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b)),
    );
    setExpanded(photoIndex);
  };

  const allPopped = bubbles.every((b) => b.popped);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, oklch(0.75 0.14 155 / 0.9), oklch(0.55 0.18 155))",
      }}
      data-ocid="unbox.soda_scene"
    >
      {/* Rising BG bubbles */}
      {BG_BUBBLE_KEYS.map((bubbleKey, i) => (
        <motion.div
          key={bubbleKey}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{
            width: 4 + (i % 4) * 5,
            height: 4 + (i % 4) * 5,
            left: `${(i * 6.2) % 98}%`,
            bottom: -20,
          }}
          animate={{ y: [0, -1200], opacity: [0, 0.7, 0] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4 + (i % 5),
            delay: i * 0.3,
            ease: "linear",
          }}
        />
      ))}

      <div className="absolute top-0 inset-x-0 flex items-center justify-center pt-8 z-10 pointer-events-none">
        <div className="bg-white/30 backdrop-blur-sm rounded-full px-6 py-2 border border-white/40">
          <span className="font-display font-bold text-foreground text-sm">
            🍹 Tap the bubbles!
          </span>
        </div>
      </div>

      {/* Soda float glass — decorative base layer */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-0 pointer-events-none"
        aria-hidden="true"
      >
        <img
          src="/assets/charms/soda-float.jpg"
          alt="Soda float glass"
          className="w-52 object-contain"
          style={{ mixBlendMode: "multiply", opacity: 0.88 }}
        />
      </div>

      {/* Photo bubbles */}
      {bubbles.map((bubble) => (
        <AnimatePresence key={`bubble-${bubble.id}`}>
          {!bubble.popped && (
            <motion.button
              type="button"
              onClick={() => popBubble(bubble.id, bubble.photoIndex)}
              data-ocid={`unbox.soda_bubble.${bubble.id + 1}`}
              initial={{ bottom: -bubble.size - 20, opacity: 0 }}
              animate={{ bottom: "55%", opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: bubble.speed, ease: "easeOut" }}
              aria-label={`Tap bubble ${bubble.id + 1}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: "absolute",
                left: `${bubble.x}%`,
                width: bubble.size,
                height: bubble.size,
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid rgba(255,255,255,0.6)",
                boxShadow:
                  "0 0 20px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.1)",
                zIndex: 1,
              }}
            >
              <img
                src={getPhotoUrl(photos[bubble.photoIndex])}
                alt={`Tap bubble ${bubble.id + 1}`}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute top-2 left-3 w-4 h-2 rounded-full bg-white/50 pointer-events-none"
                style={{ transform: "rotate(-30deg)" }}
              />
            </motion.button>
          )}
        </AnimatePresence>
      ))}

      {allPopped && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-7xl">🎉</span>
        </motion.div>
      )}

      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
            data-ocid="unbox.soda_fullscreen"
          >
            <motion.img
              src={getPhotoUrl(photos[expanded])}
              alt={`Memory ${expanded + 1} expanded`}
              className="max-w-full max-h-full rounded-2xl sticker-shadow"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Open When ────────────────────────────────────────────────────────────────

function OpenWhen({
  photos,
  openWhenTime,
  note,
}: { photos: Photo[]; openWhenTime?: bigint; note: string }) {
  const unlockAt = openWhenTime ? Number(openWhenTime) / 1_000_000 : null;
  const [now, setNow] = useState(Date.now());
  const isLocked = unlockAt !== null && now < unlockAt;

  useEffect(() => {
    if (!isLocked) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  const remaining = unlockAt ? Math.max(0, unlockAt - now) : 0;
  const hh = Math.floor(remaining / 3_600_000);
  const mm = Math.floor((remaining % 3_600_000) / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000);
  const timeUnits = [
    { label: "hours", val: hh },
    { label: "min", val: mm },
    { label: "sec", val: ss },
  ];

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
          className="text-7xl"
        >
          🔒
        </motion.div>
        <div className="text-center max-w-sm">
          <p className="font-display font-bold text-2xl text-foreground">
            {note}
          </p>
          <p className="text-muted-foreground font-body text-sm mt-2">
            This letter unlocks when the time is right ✨
          </p>
        </div>

        <div className="flex gap-4" data-ocid="unbox.countdown">
          {timeUnits.map(({ label, val }) => (
            <div
              key={label}
              className="flex flex-col items-center bg-card rounded-2xl px-6 py-4 sticker-shadow border border-border"
            >
              <span className="font-display font-bold text-3xl text-accent">
                {String(val).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground font-body">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {photos.slice(0, 4).map((lockedPhoto) => {
            const lurl = getPhotoUrl(lockedPhoto);
            return (
              <div
                key={lurl}
                className="aspect-square rounded-xl overflow-hidden relative"
              >
                <img
                  src={lurl}
                  alt="Locked — not yet"
                  className="w-full h-full object-cover blur-xl brightness-50"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 p-6 min-h-screen justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-6xl"
      >
        💌
      </motion.div>
      <motion.p
        className="font-display font-bold text-2xl text-center text-foreground max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {note}
      </motion.p>
      <motion.div
        className="grid grid-cols-2 gap-3 max-w-sm w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {photos.map((revealedPhoto, i) => {
          const rurl = getPhotoUrl(revealedPhoto);
          return (
            <motion.div
              key={rurl}
              data-ocid={`unbox.open_when_photo.${i + 1}`}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.8 + i * 0.2, duration: 0.8 }}
              className="aspect-square rounded-2xl overflow-hidden sticker-shadow"
            >
              <img
                src={rurl}
                alt={`Memory ${i + 1} revealed`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── Music Box ────────────────────────────────────────────────────────────────

function MusicBox({ photos }: { photos: Photo[] }) {
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.div
            key="closed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="font-display text-muted-foreground text-sm">
              tap to open the music box
            </p>
            <motion.button
              type="button"
              onClick={() => setOpened(true)}
              data-ocid="unbox.musicbox_button"
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2,
                ease: "easeInOut",
              }}
              whileTap={{ scale: 0.9 }}
              aria-label="Open the music box"
              className="relative w-48 h-48 cursor-pointer"
            >
              {/* Box base */}
              <div className="absolute bottom-0 inset-x-0 h-28 rounded-2xl bg-gradient-to-b from-primary/30 to-primary/60 border-4 border-primary/40 sticker-shadow flex items-end justify-center pb-3">
                <span className="text-2xl">🎵</span>
              </div>
              {/* Box lid */}
              <motion.div
                className="absolute top-0 inset-x-0 h-20 rounded-t-2xl bg-gradient-to-b from-accent/50 to-primary/30 border-4 border-accent/40 flex items-center justify-center"
                style={{ transformOrigin: "bottom center" }}
                animate={{ rotateX: [0, -5, 0] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
              >
                <span className="text-4xl">💝</span>
              </motion.div>
            </motion.button>
            <p className="font-display font-bold text-xl text-foreground">
              Music Box
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 w-full max-w-sm"
          >
            {/* Open box */}
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 180 }}
              className="relative w-48 h-48"
            >
              <div className="absolute bottom-0 inset-x-0 h-28 rounded-2xl bg-gradient-to-b from-primary/30 to-primary/60 border-4 border-primary/40 sticker-shadow flex items-end justify-center pb-3">
                <span className="text-2xl">🎵</span>
              </div>
              <motion.div
                className="absolute top-0 inset-x-0 h-20 rounded-t-2xl bg-gradient-to-b from-accent/50 to-primary/30 border-4 border-accent/40 flex items-center justify-center"
                style={{ transformOrigin: "bottom center" }}
                initial={{ rotateX: 0 }}
                animate={{ rotateX: -100 }}
                transition={{ duration: 0.8, ease: "backOut" }}
              >
                <span className="text-4xl">💝</span>
              </motion.div>
              {/* Music notes floating out */}
              {["🎵", "🎶", "♪"].map((note, i) => (
                <motion.span
                  key={`note-${note}`}
                  className="absolute text-2xl pointer-events-none"
                  style={{ left: "40%", top: "30%" }}
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [-20, -80],
                    x: [0, (i - 1) * 30],
                  }}
                  transition={{
                    delay: i * 0.3,
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 0.5,
                  }}
                >
                  {note}
                </motion.span>
              ))}
            </motion.div>

            {/* Photos revealed */}
            <div className="flex flex-wrap gap-3 justify-center">
              {photos.map((mbPhoto, i) => {
                const mbUrl = getPhotoUrl(mbPhoto);
                return (
                  <motion.button
                    key={mbUrl}
                    type="button"
                    onClick={() => setExpanded(i)}
                    data-ocid={`unbox.musicbox_photo.${i + 1}`}
                    initial={{ opacity: 0, scale: 0, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.5 + i * 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    aria-label={`Memory ${i + 1}`}
                    className="w-24 h-24 rounded-2xl overflow-hidden sticker-shadow border-2 border-accent/30 cursor-pointer"
                  >
                    <img
                      src={mbUrl}
                      alt={`Memory ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
            data-ocid="unbox.musicbox_fullscreen"
          >
            <motion.img
              src={getPhotoUrl(photos[expanded])}
              alt={`Memory ${expanded + 1} expanded`}
              className="max-w-full max-h-full rounded-2xl sticker-shadow"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Strawberry Jar ───────────────────────────────────────────────────────────

function StrawberryJar({ photos }: { photos: Photo[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [revealedPhoto, setRevealedPhoto] = useState<number | null>(null);

  // Physics state: each element has position + velocity
  const COUNT = Math.min(photos.length, 5);
  const jarBounds = { x: 0.12, y: 0.12, w: 0.76, h: 0.68 }; // fraction of 360x420 jar

  // Initial positions spread across jar interior
  const INIT_POSITIONS = [
    { x: 90, y: 160 },
    { x: 220, y: 100 },
    { x: 155, y: 200 },
    { x: 70, y: 260 },
    { x: 270, y: 250 },
  ];

  const posRef = useRef(INIT_POSITIONS.slice(0, COUNT).map((p) => ({ ...p })));
  const velRef = useRef(Array.from({ length: COUNT }, () => ({ x: 0, y: 0 })));
  const tiltRef = useRef({ x: 0, y: 0 });
  const [positions, setPositions] = useState(() =>
    posRef.current.map((p) => ({ ...p })),
  );
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; emoji: string }[]
  >([]);
  const animFrameRef = useRef<number | null>(null);
  const particleIdRef = useRef(0);
  const [tiltMag, setTiltMag] = useState(0);

  const JAR_W = 360;
  const JAR_H = 420;
  const ELEM_R = 44; // radius of each element

  const clampInJar = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const minX = jarBounds.x * JAR_W + ELEM_R;
      const maxX = (jarBounds.x + jarBounds.w) * JAR_W - ELEM_R;
      const minY = jarBounds.y * JAR_H + ELEM_R;
      const maxY = (jarBounds.y + jarBounds.h) * JAR_H - ELEM_R;
      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    },
    [],
  );

  const spawnParticles = useCallback((px: number, py: number) => {
    const TRAIL_EMOJIS = ["✦", "★", "✧", "⋆"];
    const newParticles = Array.from({ length: 3 }, (_, i) => ({
      id: particleIdRef.current++,
      x: px + (Math.random() - 0.5) * 20,
      y: py + (Math.random() - 0.5) * 20,
      emoji: TRAIL_EMOJIS[i % TRAIL_EMOJIS.length],
    }));
    setParticles((prev) => {
      const next = [...prev, ...newParticles].slice(-30);
      return next;
    });
    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((n) => n.id === p.id)),
      );
    }, 800);
  }, []);

  // Physics loop
  useEffect(() => {
    const DAMPING = 0.85;
    const SPRING = 0.08;
    const GRAVITY_SCALE = 6;

    let lastSpawn = 0;

    function step() {
      const tilt = tiltRef.current;
      const mag = Math.sqrt(tilt.x * tilt.x + tilt.y * tilt.y);
      setTiltMag(Math.min(1, mag / 25));

      const pos = posRef.current;
      const vel = velRef.current;

      // Gravity from tilt
      const gx = (tilt.x / 30) * GRAVITY_SCALE;
      const gy = (tilt.y / 30) * GRAVITY_SCALE;

      let totalSpeed = 0;
      for (let i = 0; i < COUNT; i++) {
        vel[i].x = vel[i].x * DAMPING + gx * (1 - DAMPING);
        vel[i].y = vel[i].y * DAMPING + gy * (1 - DAMPING);

        // Spring back to rough center if near edge
        const cx = JAR_W / 2;
        const cy = JAR_H * 0.55;
        const distX = pos[i].x - cx;
        const distY = pos[i].y - cy;
        vel[i].x -= distX * SPRING * 0.02;
        vel[i].y -= distY * SPRING * 0.02;

        pos[i].x += vel[i].x;
        pos[i].y += vel[i].y;

        // Clamp + bounce
        const clamped = clampInJar(pos[i].x, pos[i].y);
        if (clamped.x !== pos[i].x) {
          vel[i].x *= -0.5;
          pos[i].x = clamped.x;
        }
        if (clamped.y !== pos[i].y) {
          vel[i].y *= -0.5;
          pos[i].y = clamped.y;
        }

        // Element-element collision
        for (let j = i + 1; j < COUNT; j++) {
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ELEM_R * 2.1;
          if (dist < minDist && dist > 0.01) {
            const push = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            pos[i].x -= nx * push;
            pos[i].y -= ny * push;
            pos[j].x += nx * push;
            pos[j].y += ny * push;
            const relVx = vel[j].x - vel[i].x;
            const relVy = vel[j].y - vel[i].y;
            const dot = relVx * nx + relVy * ny;
            if (dot < 0) {
              vel[i].x += dot * nx * 0.4;
              vel[i].y += dot * ny * 0.4;
              vel[j].x -= dot * nx * 0.4;
              vel[j].y -= dot * ny * 0.4;
            }
          }
        }

        totalSpeed += Math.abs(vel[i].x) + Math.abs(vel[i].y);
      }

      setPositions(pos.map((p) => ({ ...p })));

      // Spawn trail particles when moving fast
      if (totalSpeed > COUNT * 0.8 && Date.now() - lastSpawn > 200) {
        lastSpawn = Date.now();
        let fastestIdx = 0;
        let maxSpeed = 0;
        for (let i = 0; i < COUNT; i++) {
          const speed = Math.abs(vel[i].x) + Math.abs(vel[i].y);
          if (speed > maxSpeed) {
            maxSpeed = speed;
            fastestIdx = i;
          }
        }
        spawnParticles(pos[fastestIdx].x, pos[fastestIdx].y);
      }

      animFrameRef.current = requestAnimationFrame(step);
    }

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [COUNT, clampInJar, spawnParticles]);

  // Mouse tilt
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    tiltRef.current = {
      x: ((e.clientX - cx) / (rect.width / 2)) * 22,
      y: ((e.clientY - cy) / (rect.height / 2)) * 14,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    tiltRef.current = { x: 0, y: 0 };
  }, []);

  // Device orientation
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      tiltRef.current = {
        x: Math.max(-30, Math.min(30, e.gamma ?? 0)),
        y: Math.max(-20, Math.min(20, (e.beta ?? 0) - 40)),
      };
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  const handleBerryTap = (i: number) => {
    setRevealedPhoto(i);
    spawnParticles(positions[i]?.x ?? JAR_W / 2, positions[i]?.y ?? JAR_H / 2);
  };

  // Glow color based on tilt magnitude: green → red
  const jarGlowColor =
    tiltMag < 0.5
      ? `oklch(0.68 ${0.08 + tiltMag * 0.12} 145 / ${0.3 + tiltMag * 0.5})`
      : `oklch(0.56 ${0.18 + (tiltMag - 0.5) * 0.18} 15 / ${0.3 + tiltMag * 0.5})`;

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.96 0.02 90) 0%, oklch(0.90 0.05 80) 40%, oklch(0.82 0.07 100) 100%)",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-ocid="unbox.jar_scene"
    >
      {/* Gingham shelf */}
      <div
        className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-conic-gradient(oklch(0.85 0.06 35 / 0.22) 0% 25%, transparent 0% 50%)",
          backgroundSize: "28px 28px",
          borderTop: "3px solid oklch(0.72 0.12 15 / 0.35)",
        }}
      />

      {/* Ambient floating elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {(["✦", "★", "✧", "⋆", "✦_2", "★_2"] as const).map((star) => (
          <motion.span
            key={`jar-ambient-star-${star}`}
            className="absolute text-xs select-none opacity-40"
            style={{
              left: `${8 + ["✦", "★", "✧", "⋆", "✦_2", "★_2"].indexOf(star) * 14}%`,
              top: `${15 + (["✦", "★", "✧", "⋆", "✦_2", "★_2"].indexOf(star) % 4) * 18}%`,
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration:
                2.5 + ["✦", "★", "✧", "⋆", "✦_2", "★_2"].indexOf(star) * 0.4,
              repeat: Number.POSITIVE_INFINITY,
              delay: ["✦", "★", "✧", "⋆", "✦_2", "★_2"].indexOf(star) * 0.3,
              ease: "easeInOut",
            }}
          >
            {star}
          </motion.span>
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute top-8 inset-x-0 text-center pointer-events-none z-10">
        <p className="font-display font-bold text-foreground/80 text-sm bg-white/60 backdrop-blur-sm rounded-full px-5 py-1.5 inline-block border border-primary/20">
          🫙 Tilt the jar · Tap a berry to reveal!
        </p>
      </div>

      {/* JAR SVG + Physics canvas */}
      <div
        className="relative"
        style={{
          width: JAR_W,
          height: JAR_H,
          maxWidth: "90vw",
          maxHeight: "62vh",
        }}
      >
        {/* Frosted glass jar body */}
        <svg
          viewBox={`0 0 ${JAR_W} ${JAR_H}`}
          className="absolute inset-0 w-full h-full"
          style={{ filter: `drop-shadow(0 0 28px ${jarGlowColor})` }}
          aria-hidden="true"
        >
          {/* Jar body */}
          <rect
            x="32"
            y="80"
            width="296"
            height="320"
            rx="52"
            ry="52"
            fill="oklch(0.97 0.01 200 / 0.55)"
            stroke="oklch(0.56 0.24 15 / 0.5)"
            strokeWidth="4"
          />
          {/* Glass sheen */}
          <rect
            x="52"
            y="100"
            width="28"
            height="200"
            rx="14"
            fill="white"
            opacity="0.22"
          />
          {/* Jar lid */}
          <rect
            x="60"
            y="52"
            width="240"
            height="44"
            rx="16"
            fill="oklch(0.56 0.24 15 / 0.8)"
            stroke="oklch(0.45 0.20 15)"
            strokeWidth="3"
          />
          {/* Lid shine */}
          <rect
            x="80"
            y="58"
            width="80"
            height="10"
            rx="5"
            fill="white"
            opacity="0.35"
          />
          {/* Water level fill */}
          <rect
            x="36"
            y="120"
            width="288"
            height="276"
            rx="48"
            ry="48"
            fill="oklch(0.72 0.12 210 / 0.28)"
          />
        </svg>

        {/* Particle trail layer */}
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute pointer-events-none select-none text-xs z-20"
            style={{ left: p.x, top: p.y }}
            initial={{ opacity: 0.9, scale: 1.2, y: 0 }}
            animate={{ opacity: 0, scale: 0.4, y: -24 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {p.emoji}
          </motion.span>
        ))}

        {/* Physics elements */}
        {Array.from({ length: COUNT }, (_, i) => {
          const pos = positions[i] ?? INIT_POSITIONS[i];
          const berryEmojis = ["🍓", "🍒", "🌿", "🍓", "🍒"];
          return (
            <motion.button
              // biome-ignore lint/suspicious/noArrayIndexKey: physics element count is fixed, never reorders
              key={`berry-${i}`}
              type="button"
              onClick={() => handleBerryTap(i)}
              data-ocid={`unbox.jar_photo.${i + 1}`}
              aria-label={`Berry ${i + 1} — tap to reveal`}
              className="absolute overflow-hidden border-4 cursor-pointer z-10"
              style={{
                width: ELEM_R * 2,
                height: ELEM_R * 2,
                borderRadius: "50%",
                left: pos.x - ELEM_R,
                top: pos.y - ELEM_R,
                borderColor: "oklch(0.56 0.24 15 / 0.7)",
                boxShadow:
                  "0 4px 16px oklch(0.56 0.24 15 / 0.3), inset 0 -3px 8px rgba(0,0,0,0.12)",
              }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
            >
              <img
                src={getPhotoUrl(photos[i])}
                alt={`Memory ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Berry emoji badge */}
              <span className="absolute bottom-0 right-0 text-lg leading-none">
                {berryEmojis[i]}
              </span>
              {/* Glass gloss */}
              <div
                className="absolute top-2 left-2 w-4 h-2.5 rounded-full bg-white/50 pointer-events-none"
                style={{ transform: "rotate(-25deg)" }}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Photo bloom reveal modal */}
      <AnimatePresence>
        {revealedPhoto !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "oklch(0.15 0.05 300 / 0.85)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRevealedPhoto(null)}
            data-ocid="unbox.jar_reveal"
          >
            <motion.div
              className="relative flex flex-col items-center gap-4"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bloom radial glow */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.56 0.24 15 / 0.4) 0%, transparent 70%)",
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 2.2, opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.8 }}
              />
              <span className="text-5xl animate-bounce">🍓</span>
              <img
                src={getPhotoUrl(photos[revealedPhoto])}
                alt={`Memory ${revealedPhoto + 1} revealed`}
                className="w-72 h-72 object-cover rounded-2xl"
                style={{ boxShadow: "0 0 40px oklch(0.56 0.24 15 / 0.5)" }}
              />
              <p className="font-display text-foreground/80 text-sm bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm">
                Memory {revealedPhoto + 1} of {photos.length} ✨
              </p>
              <button
                type="button"
                onClick={() => {
                  setExpanded(revealedPhoto);
                  setRevealedPhoto(null);
                }}
                className="font-display text-xs text-accent underline"
              >
                Open full size →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
            data-ocid="unbox.jar_fullscreen"
          >
            <motion.img
              src={getPhotoUrl(photos[expanded])}
              alt={`Memory ${expanded + 1} expanded`}
              className="max-w-full max-h-full rounded-2xl sticker-shadow"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Clover Field ─────────────────────────────────────────────────────────────

const CLOVER_POSITIONS: Array<{ top: string; left: string }> = [
  { top: "28%", left: "12%" },
  { top: "55%", left: "22%" },
  { top: "38%", left: "45%" },
  { top: "62%", left: "60%" },
  { top: "25%", left: "72%" },
];
const LADYBUG_POSITION = { top: "48%", left: "82%" };
const ALL_HUNT_ITEMS = [
  ...CLOVER_POSITIONS.map((pos, i) => ({
    type: "clover" as const,
    pos,
    idx: i,
  })),
  { type: "ladybug" as const, pos: LADYBUG_POSITION, idx: 5 },
];

function CloverField({ photos }: { photos: Photo[] }) {
  const [discovered, setDiscovered] = useState<boolean[]>(Array(6).fill(false));
  const [expanded, setExpanded] = useState<number | null>(null);
  const [revealPhoto, setRevealPhoto] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const discoveredCount = discovered.filter(Boolean).length;
  const _allFound = discoveredCount === 6;

  const handleDiscover = useCallback(
    (idx: number) => {
      if (discovered[idx]) return;
      setDiscovered((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setRevealPhoto(idx);
      if (discoveredCount === 5) {
        setTimeout(() => setShowCelebration(true), 600);
      }
    },
    [discovered, discoveredCount],
  );

  // Ambient sparkle positions
  const SPARKLES = Array.from({ length: 14 }, (_, i) => ({
    key: `sparkle-${i}`,
    left: `${(i * 7.3) % 95}%`,
    top: `${10 + ((i * 11.7) % 72)}%`,
    emoji: (["✦", "🌀", "✧", "⋆", "✦", "✧", "🌸"] as const)[i % 7],
    dur: 3 + (i % 5) * 0.7,
    delay: i * 0.22,
  }));

  // Sky daisies
  const SKY_DAISIES = Array.from({ length: 6 }, (_, i) => ({
    key: `sky-daisy-${i}`,
    left: `${5 + i * 16}%`,
    top: `${5 + (i % 3) * 8}%`,
    emoji: (["🌼", "🌸", "🌼", "🌺", "🌸", "🌼"] as const)[i],
    dur: 5 + i * 0.8,
    delay: i * 0.5,
  }));

  const photoCount = Math.min(photos.length, 6);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      data-ocid="unbox.clover_scene"
    >
      {/* Real clover field photo as base background */}
      <img
        src="/assets/charms/clover-field.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Soft overlay to keep interaction elements readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.92 0.06 190 / 0.25) 0%, oklch(0.60 0.18 142 / 0.18) 100%)",
          zIndex: 0,
        }}
      />
      {/* === LAYER 1: Sky — static daisies + floating spirals === */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {SKY_DAISIES.map((d) => (
          <motion.span
            key={d.key}
            className="absolute text-xl select-none opacity-50"
            style={{ left: d.left, top: d.top }}
            animate={{ y: [0, -8, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: d.dur,
              repeat: Number.POSITIVE_INFINITY,
              delay: d.delay,
              ease: "easeInOut",
            }}
          >
            {d.emoji}
          </motion.span>
        ))}
      </div>

      {/* === LAYER 2: Mid-ground — gentle sway === */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative static array, order never changes
            key={`clover-mid-blob-${i}`}
            className="absolute rounded-full"
            style={{
              width: 40 + i * 12,
              height: 40 + i * 12,
              left: `${5 + i * 12}%`,
              top: `${55 + (i % 3) * 8}%`,
              background: `oklch(0.65 0.15 ${142 + i * 3} / 0.18)`,
            }}
            animate={{ y: [0, -6, 0], x: [0, 4, 0] }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.35,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* === LAYER 3: Foreground — grass blades === */}
      <div
        className="absolute bottom-0 inset-x-0 h-28 pointer-events-none"
        aria-hidden="true"
      >
        {Array.from({ length: 28 }, (_, i) => (
          <motion.div
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative static array, order never changes
            key={`clover-grass-blade-${i}`}
            className="absolute bottom-0 rounded-full origin-bottom"
            style={{
              left: `${i * 3.6}%`,
              width: 3 + (i % 3),
              height: 24 + (i % 7) * 8,
              background: `oklch(${0.52 + (i % 4) * 0.04} 0.18 ${138 + (i % 6) * 4})`,
            }}
            animate={{ rotate: [0, 6, 0, -5, 0], scaleY: [1, 1.04, 1] }}
            transition={{
              duration: 1.8 + (i % 4) * 0.4,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.07,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* === Ambient sparkles + spirals === */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {SPARKLES.map((s) => (
          <motion.span
            key={s.key}
            className="absolute text-sm select-none"
            style={{ left: s.left, top: s.top, opacity: 0.4 }}
            animate={{
              y: [0, -16, 0],
              rotate: [0, 180, 360],
              opacity: [0.25, 0.6, 0.25],
            }}
            transition={{
              duration: s.dur,
              repeat: Number.POSITIVE_INFINITY,
              delay: s.delay,
              ease: "easeInOut",
            }}
          >
            {s.emoji}
          </motion.span>
        ))}
      </div>

      {/* === Progress pill === */}
      <div className="absolute top-8 inset-x-0 z-20 text-center pointer-events-none">
        <motion.div
          className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-white/50 rounded-full px-5 py-2 shadow-sm"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <span className="font-display font-bold text-sm text-foreground">
            {discoveredCount} / 6 found 🍀
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div
                // biome-ignore lint/suspicious/noArrayIndexKey: decorative static array, order never changes
                key={`clover-pip-dot-${i}`}
                className="w-2 h-2 rounded-full"
                style={{
                  background: discovered[i]
                    ? "oklch(0.56 0.18 142)"
                    : "oklch(0.7 0.04 300 / 0.4)",
                }}
                animate={discovered[i] ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* === Hunt buttons (5 clovers + 1 ladybug) === */}
      {ALL_HUNT_ITEMS.map((item) => {
        const isFound = discovered[item.idx];
        const _photoIdx = Math.min(item.idx, photoCount - 1);
        return (
          <AnimatePresence key={`hunt-${item.type}-${item.idx}`}>
            {!isFound && (
              <motion.button
                type="button"
                onClick={() => handleDiscover(item.idx)}
                data-ocid={`unbox.${item.type === "clover" ? "clover" : "ladybug"}_button.${item.idx + 1}`}
                aria-label={
                  item.type === "clover" ? "Four-leaf clover" : "Ladybug"
                }
                className="absolute z-10 cursor-pointer text-4xl select-none"
                style={{ top: item.pos.top, left: item.pos.left }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: [0.9, 1.05, 0.9],
                  rotate: item.type === "ladybug" ? [0, 8, -8, 0] : [0, 5, 0],
                  y: [0, -4, 0],
                }}
                transition={{
                  opacity: { duration: 0.4 },
                  scale: {
                    duration: 2.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  },
                  rotate: {
                    duration: item.type === "ladybug" ? 4 : 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  },
                  y: {
                    duration: 2.5 + item.idx * 0.3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  },
                }}
                exit={{
                  scale: 1.8,
                  opacity: 0,
                  transition: { duration: 0.35 },
                }}
                whileHover={{ scale: 1.35 }}
                whileTap={{ scale: 0.75 }}
              >
                {item.type === "clover" ? "🍀" : "🐞"}
                {/* Subtle pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, oklch(0.65 0.18 142 / 0.35) 0%, transparent 70%)",
                  }}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </motion.button>
            )}
          </AnimatePresence>
        );
      })}

      {/* === Individual photo reveal modal === */}
      <AnimatePresence>
        {revealPhoto !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "oklch(0.12 0.04 300 / 0.82)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRevealPhoto(null)}
            data-ocid="unbox.clover_reveal"
          >
            <motion.div
              className="relative flex flex-col items-center gap-4"
              initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Green radial bloom */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.65 0.22 142 / 0.55) 0%, transparent 65%)",
                }}
                initial={{ scale: 0.3 }}
                animate={{ scale: 2.5, opacity: [1, 0] }}
                transition={{ duration: 0.8 }}
              />
              <motion.div
                className="text-5xl"
                initial={{ scale: 0.5 }}
                animate={{ scale: [1.3, 1] }}
                transition={{ duration: 0.4 }}
              >
                {ALL_HUNT_ITEMS[revealPhoto ?? 0]?.type === "ladybug"
                  ? "🐞"
                  : "🍀"}
              </motion.div>
              {revealPhoto !== null && revealPhoto < photoCount && (
                <motion.img
                  src={getPhotoUrl(photos[revealPhoto])}
                  alt={`Memory ${revealPhoto + 1} revealed`}
                  className="w-64 h-64 object-cover rounded-2xl"
                  style={{ boxShadow: "0 0 36px oklch(0.65 0.22 142 / 0.6)" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                />
              )}
              <p className="font-display text-white/90 text-sm bg-white/15 px-4 py-1 rounded-full backdrop-blur-sm">
                {discoveredCount + 1} / 6 discovered ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === All-found celebration overlay + photo grid === */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 p-8"
            style={{ background: "oklch(0.12 0.04 300 / 0.88)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-ocid="unbox.clover_celebration"
          >
            {/* Celebration spiral emojis */}
            {/* Celebration spiral emojis */}
            {Array.from({ length: 12 }, (_, i) => (
              <motion.span
                // biome-ignore lint/suspicious/noArrayIndexKey: decorative static array, order never changes
                key={`clover-confetti-${i}`}
                className="fixed text-2xl pointer-events-none"
                style={{
                  left: `${(i * 8.5) % 95}%`,
                  top: `${(i * 13.2) % 90}%`,
                }}
                initial={{ y: -80, opacity: 0, rotate: 0 }}
                animate={{
                  y: [null, 120],
                  opacity: [0, 1, 1, 0],
                  rotate: 360,
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.12,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 0.5,
                }}
              >
                {(["🍀", "✦", "🌀", "✧", "🌸", "⭐"] as const)[i % 6]}
              </motion.span>
            ))}

            <motion.div
              className="text-6xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.4, 1] }}
              transition={{ duration: 0.6, ease: "backOut" }}
            >
              🌸
            </motion.div>
            <motion.p
              className="font-display font-bold text-2xl text-white text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              All 6 found! The field blooms! 🍀
            </motion.p>

            <div className="flex flex-wrap gap-3 justify-center max-w-sm">
              {photos.slice(0, 6).map((cfPhoto, i) => {
                const cfUrl = getPhotoUrl(cfPhoto);
                return (
                  <motion.button
                    key={cfUrl}
                    type="button"
                    onClick={() => setExpanded(i)}
                    data-ocid={`unbox.clover_photo.${i + 1}`}
                    initial={{ opacity: 0, scale: 0, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.5 + i * 0.15,
                      type: "spring",
                      stiffness: 200,
                    }}
                    whileHover={{ scale: 1.12, rotate: 5 }}
                    aria-label={`Memory ${i + 1}`}
                    className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/60 cursor-pointer"
                    style={{ boxShadow: "0 0 18px oklch(0.65 0.22 142 / 0.4)" }}
                  >
                    <img
                      src={cfUrl}
                      alt={`Memory ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              data-ocid="unbox.clover_celebration_close"
              className="font-display text-white/70 text-sm underline"
            >
              Back to field
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
            data-ocid="unbox.clover_fullscreen"
          >
            <motion.img
              src={getPhotoUrl(photos[expanded])}
              alt={`Memory ${expanded + 1} expanded`}
              className="max-w-full max-h-full rounded-2xl sticker-shadow"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Photo Gallery Grid ─────────────────────────────────────────────────────────────────────────────────────

function PhotoGallery({
  photos,
  secretNote,
}: { photos: Photo[]; secretNote?: string }) {
  const [flipped, setFlipped] = useState<boolean[]>(photos.map(() => false));

  // Deterministic rotation per photo index: 2-5 degrees, alternating sign
  function photoRotation(i: number): number {
    const rots = [-3, 2, -2, 4, -4, 3, -3, 2];
    return rots[i % rots.length];
  }

  return (
    <div className="px-4 pb-16 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="font-display font-bold text-2xl text-foreground">
          All Memories 💗
        </h2>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {photos.length} {photos.length !== 1 ? "memories" : "memory"} inside
        </p>
      </motion.div>

      <div className="flex flex-col items-center gap-10">
        {photos.map((photo, i) => {
          const isFlipped = flipped[i];

          return (
            <motion.div
              key={getPhotoUrl(photo)}
              data-ocid={`unbox.gallery_photo.${i + 1}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <PolaroidFrame
                rotation={photoRotation(i)}
                caption={`memory ${i + 1}`}
                className="w-56"
              >
                <div style={{ perspective: "1000px" }}>
                  <div
                    style={{
                      transform: isFlipped
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                      transformStyle: "preserve-3d",
                      transition: "transform 0.6s ease",
                      position: "relative",
                      aspectRatio: "1",
                    }}
                  >
                    <div style={{ backfaceVisibility: "hidden" }}>
                      <img
                        src={getPhotoUrl(photo)}
                        alt={`Memory ${i + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                    </div>

                    {secretNote && (
                      <div
                        className="absolute inset-0 bg-[#FFF6E9] border border-[#EADBC8] p-4 flex items-center justify-center"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <div className="text-center">
                          <p
                            className="text-xs mb-2"
                            style={{
                              fontFamily: "Caveat, cursive",
                              color: "#E85A5A",
                            }}
                          >
                            💕 secret note
                          </p>
                          <p
                            className="text-base italic text-[#3D2C1E] leading-relaxed"
                            style={{ fontFamily: "Caveat, cursive" }}
                          >
                            {secretNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </PolaroidFrame>

              {secretNote && (
                <div className="mt-2 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFlipped((prev) => {
                        const next = [...prev];
                        next[i] = !next[i];
                        return next;
                      })
                    }
                    data-ocid={`unbox.flip_photo_button.${i + 1}`}
                    className="text-xs text-muted-foreground hover:text-accent font-body rounded-full"
                  >
                    {isFlipped ? "↩ Flip Back" : "🔄 Flip for Secret Note"}
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main UnboxPage ───────────────────────────────────────────────────────────

export function UnboxPage() {
  const { id } = useParams({ from: "/letter/$id" });
  const { data: letter, isLoading, isError } = useLetter(id ?? null);
  const { mutate: markRead } = useMarkRead();
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (letter && opened && !letter.isRead) markRead(letter.id);
  }, [letter, opened, markRead]);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6 p-6"
        data-ocid="unbox.loading_state"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 2,
            ease: "linear",
          }}
          className="text-5xl"
        >
          💌
        </motion.div>
        <div className="flex flex-col items-center gap-3 w-64">
          <Skeleton className="h-4 w-48 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
        <p className="font-display text-muted-foreground text-sm animate-pulse">
          Loading your VibeMail…
        </p>
      </div>
    );
  }

  if (isError || !letter) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center"
        data-ocid="unbox.error_state"
      >
        <span className="text-6xl">📭</span>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Letter not found
          </h1>
          <p className="text-muted-foreground font-body mt-2 text-sm">
            This VibeMail might have expired or the link is incorrect.
          </p>
        </div>
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          data-ocid="unbox.back_button"
          className="rounded-full font-display"
        >
          ← Go Back
        </Button>
      </div>
    );
  }

  if (!opened) {
    return (
      <>
        {letter.musicLoop && <MusicPlayer loop={letter.musicLoop} />}
        <EnvelopeIntro letter={letter} onOpen={() => setOpened(true)} />
      </>
    );
  }

  const renderUnboxing = () => {
    switch (letter.unboxingType) {
      case UnboxingType.polaroidStack:
        return (
          <PolaroidStack
            photos={letter.photos}
            secretNote={letter.secretNote}
          />
        );
      case UnboxingType.secretLocket:
        return <SecretLocket photos={letter.photos} />;
      case UnboxingType.cdStickerPeeler:
        return <CDStickerPeeler photos={letter.photos} />;
      case UnboxingType.fruitSoda:
        return <FruitSoda photos={letter.photos} />;
      case UnboxingType.openWhen:
        return (
          <OpenWhen
            photos={letter.photos}
            openWhenTime={letter.openWhenTime}
            note={letter.note}
          />
        );
      case UnboxingType.musicBox:
        return <MusicBox photos={letter.photos} />;
      case UnboxingType.strawberryJar:
        return <StrawberryJar photos={letter.photos} />;
      case UnboxingType.cloverField:
        return <CloverField photos={letter.photos} />;
    }
  };

  // Deterministic stamp/seal selection by letter id hash
  const HEADER_STAMPS = [
    "/assets/stamps/stamp-miffy.jpg",
    "/assets/stamps/stamp-lucky-charm.jpg",
    "/assets/stamps/stamp-snoopy-phone.jpg",
    "/assets/stamps/stamp-snoopy-letter.jpg",
    "/assets/stamps/stamp-call-me.jpg",
  ];
  const HEADER_SEALS = [
    "/assets/seals/seal-bow.png",
    "/assets/seals/seal-cloud.png",
  ];
  let hdrHash = 0;
  for (let i = 0; i < letter.id.length; i++)
    hdrHash = (hdrHash * 31 + letter.id.charCodeAt(i)) | 0;
  const hdrStamp = HEADER_STAMPS[Math.abs(hdrHash) % HEADER_STAMPS.length];
  const hdrSeal = HEADER_SEALS[Math.abs(hdrHash + 2) % HEADER_SEALS.length];

  return (
    <div
      className="min-h-screen jumi-gingham"
      style={{ background: "#FFF6E9" }}
      data-ocid="unbox.page"
    >
      {letter.musicLoop && <MusicPlayer loop={letter.musicLoop} />}

      {/* Decorative tape strip across very top */}
      <div
        className="relative w-full flex justify-center pt-1 overflow-hidden"
        aria-hidden="true"
      >
        <TapeStrip
          color="pink"
          width="100%"
          angle={0}
          className="relative left-0 top-0"
        />
      </div>

      {/* Header stamp block — sender info above animation */}
      <motion.div
        className="relative flex items-center justify-between gap-4 px-6 py-5 mx-4 mt-5 mb-2 rounded-[20px] border-2 border-[#E85A5A]/30"
        style={{
          background: "rgba(255,246,233,0.92)",
          boxShadow:
            "3px 4px 0px rgba(232,90,90,0.15), 0 2px 12px rgba(0,0,0,0.06)",
        }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-ocid="unbox.header_stamp"
      >
        {/* Decorative tape corner */}
        <TapeStrip
          color="yellow"
          width={48}
          angle={-8}
          className="-top-2 left-6"
        />

        {/* Sender + date */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="font-caveat text-2xl leading-tight truncate"
            style={{ fontFamily: "Caveat, cursive", color: "#E85A5A" }}
          >
            {letter.sender.toString().slice(0, 10)}…
          </span>
          <span className="font-body text-xs text-[#7A5C4A]/70">
            {new Date(Number(letter.createdAt) / 1_000_000).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" },
            )}
          </span>
        </div>

        {/* Stamps + seal cluster */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src={hdrSeal}
            alt="Wax seal"
            aria-hidden="true"
            className="w-8 h-8 object-contain"
            style={{ mixBlendMode: "multiply" }}
          />
          <StampCard imageSrc={hdrStamp} rotation={3} className="w-14" />
        </div>
      </motion.div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={letter.unboxingType}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {renderUnboxing()}
          </motion.div>
        </AnimatePresence>

        {/* Milkshake divider after animation */}
        <ImageDivider variant="milkshake" className="my-2" />

        {/* Note block — lined paper style */}
        {letter.note && (
          <div
            className="relative mx-4 my-5 rounded-[16px] border-2 border-[#EADBC8] overflow-hidden"
            style={{
              background:
                "repeating-linear-gradient(#FFF6E9 0px, #FFF6E9 27px, #EADBC8 28px)",
              boxShadow: "2px 3px 0px rgba(168,214,114,0.25)",
              paddingTop: "36px",
              paddingBottom: "16px",
            }}
            data-ocid="unbox.note_block"
          >
            <TapeStrip
              color="green"
              width={72}
              angle={-3}
              className="left-8 -top-2"
            />
            <p className="px-5 font-body text-[#3D2C1E] text-sm leading-7 whitespace-pre-wrap">
              {letter.note}
            </p>
          </div>
        )}

        {letter.photos.length > 0 && (
          <PhotoGallery photos={letter.photos} secretNote={letter.secretNote} />
        )}

        <footer className="text-center pb-8 pt-4">
          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200"
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
