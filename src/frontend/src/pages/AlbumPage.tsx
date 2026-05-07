import { ImageDivider } from "@/components/ImageDivider";
import {
  PolaroidFrame,
  StampCard,
  TapeStrip,
} from "@/components/JumiComponents";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import { Camera, ImagePlus, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Layout } from "../components/Layout";
import {
  useAddAlbumContent,
  useAlbum,
  usePassAlbum,
} from "../hooks/use-backend";
import { PHOTO_FRAME_OPTIONS } from "../types";
import type { AlbumEntry, AlbumId } from "../types";

const THEME_EMOJI: Record<string, string> = {
  "Summer Memories": "☀️",
  "Birthday Surprise": "🎂",
  "Trip Together": "🗺️",
  "Just Because": "🌸",
};

const MEMBER_EMOJI = ["🍓", "🍀", "🐞", "🌸", "🐟", "🍬", "⭐", "🦋"];

function MemberAvatar({
  index,
  isActive,
  isPast,
}: { index: number; isActive: boolean; isPast: boolean }) {
  const emoji = MEMBER_EMOJI[index % MEMBER_EMOJI.length];
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300 ${
          isActive
            ? "border-[#A8D672] bg-[#A8D672]/10 shadow-md scale-110"
            : isPast
              ? "border-[#E85A5A] bg-[#E85A5A]/10"
              : "border-border bg-muted/40"
        }`}
      >
        {emoji}
        {isActive && (
          <span className="absolute -top-1 -right-1 text-[10px] animate-bounce">
            ✨
          </span>
        )}
        {isPast && (
          <span className="absolute -bottom-1 -right-1 text-[8px]">✓</span>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground font-body">
        {isActive ? "Now" : isPast ? "Done" : "Waiting"}
      </span>
    </div>
  );
}

const PLACEHOLDER_EMOJIS = ["📸", "🌸", "✨", "🍓"] as const;

function hashRotation(seed: string, min = -3, max = 3): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const abs = Math.abs(h);
  return min + (abs % ((max - min) * 10)) / 10;
}

function AlbumPhotoThumb(props: {
  src?: string;
  alt: string;
  frameId?: string;
  placeholderEmoji?: string;
}) {
  const { src, alt, frameId, placeholderEmoji } = props;
  const frame = frameId
    ? PHOTO_FRAME_OPTIONS.find((f) => f.id === frameId)
    : null;
  const overlayStyle: React.CSSProperties = { mixBlendMode: "multiply" };
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-3xl">{placeholderEmoji ?? "📸"}</span>
      )}
      {frame && frame.id !== "polaroid-white" && (
        <img
          src={frame.src}
          alt={frame.label}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={overlayStyle}
        />
      )}
    </div>
  );
}

function EntryCard({ entry, index }: { entry: AlbumEntry; index: number }) {
  const memberEmoji = MEMBER_EMOJI[index % MEMBER_EMOJI.length];
  const rot = hashRotation(String(entry.addedAt));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative"
    >
      {/* TapeStrip at top */}
      <TapeStrip
        color="yellow"
        width={70}
        angle={-2}
        className="-top-2 left-6"
      />
      <div
        className="jumi-card overflow-hidden"
        style={{ transform: `rotate(${rot * 0.3}deg)` }}
        data-ocid={`album.entry.item.${index + 1}`}
      >
        {/* Entry header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-2">
          <div className="w-9 h-9 rounded-full bg-[#A8D672]/10 border-2 border-[#A8D672]/30 flex items-center justify-center text-lg shrink-0">
            {memberEmoji}
          </div>
          <div className="min-w-0">
            <p
              className="font-caveat text-[15px] text-[#3D2C1E] truncate"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              friend {index + 1}'s memories
            </p>
            <p className="text-[11px] text-muted-foreground font-body">
              {new Date(
                Number(entry.addedAt / BigInt(1_000_000)),
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Photos as PolaroidFrames */}
        {entry.photoKeys.length > 0 && (
          <div className="flex gap-3 px-4 overflow-x-auto pb-3 scrollbar-none">
            {entry.photoKeys.map((key, ki) => (
              <PolaroidFrame
                key={`pk-${key}`}
                rotation={hashRotation(key + ki)}
                caption={`memory ${ki + 1}`}
                className="shrink-0 w-28"
              >
                <div className="w-28 h-28">
                  <AlbumPhotoThumb
                    src={
                      key.startsWith("mock-") || key.startsWith("img-")
                        ? undefined
                        : key
                    }
                    alt={`Memory ${ki + 1}`}
                    placeholderEmoji={PLACEHOLDER_EMOJIS[ki % 4]}
                  />
                </div>
              </PolaroidFrame>
            ))}
          </div>
        )}

        {/* Note */}
        {entry.note && (
          <div className="px-4 py-3">
            <p className="text-sm font-body text-foreground/80 italic leading-relaxed jumi-paper px-3 py-2 rounded-lg">
              &ldquo;{entry.note}&rdquo;
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddContentPanel({
  albumId,
  onPass,
}: { albumId: AlbumId; onPass: () => void }) {
  const [note, setNote] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const addContent = useAddAlbumContent();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mockKeys = Array.from({ length: photoCount }, (_, i) => `img-${i}`);
    await addContent.mutateAsync({ albumId, photoKeys: mockKeys, note });
    setNote("");
    setPhotoCount(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl border-2 border-[#A8D672]/40 bg-[#EAF5E3] overflow-hidden"
    >
      <TapeStrip
        color="green"
        width={100}
        angle={-2}
        className="-top-2 left-10"
      />
      <div className="px-5 py-4 jumi-gingham border-b border-[#A8D672]/20 mt-1">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-foreground/60" />
          <h2
            className="font-caveat text-[18px]"
            style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
          >
            add your memories ✨
          </h2>
        </div>
        <p className="text-xs text-muted-foreground font-body mt-0.5">
          it's your turn! add photos and a note, then pass the album along.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div>
          <label
            htmlFor="album-photo-input"
            className="text-xs font-caveat text-foreground block mb-2"
            style={{ fontFamily: "Caveat, cursive" }}
          >
            📸 photos
          </label>
          <input
            id="album-photo-input"
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)}
            data-ocid="album.photo_input"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-24 rounded-2xl border-2 border-dashed border-[#A8D672]/40 bg-[#A8D672]/5 hover:bg-[#A8D672]/10 hover:border-[#A8D672]/60 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
            data-ocid="album.photo_dropzone"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs font-body">
              {photoCount > 0
                ? `${photoCount} photo${photoCount !== 1 ? "s" : ""} selected ✓`
                : "tap to add photos (up to 5)"}
            </span>
          </button>
        </div>

        <div>
          <label
            htmlFor="album-note-textarea"
            className="text-xs font-caveat text-foreground block mb-2"
            style={{ fontFamily: "Caveat, cursive" }}
          >
            ✍️ your note
          </label>
          <Textarea
            id="album-note-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="leave a little message for your besties… 🌸"
            className="jumi-paper rounded-2xl border-[#A8D672]/20 bg-[#FFF6E9] font-body text-sm resize-none min-h-[80px] focus:border-[#A8D672]"
            data-ocid="album.note_textarea"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="submit"
            disabled={addContent.isPending || (photoCount === 0 && !note)}
            className="jumi-btn-primary flex-1 flex items-center justify-center gap-2"
            data-ocid="album.submit_button"
          >
            <Sparkles className="w-4 h-4" />
            {addContent.isPending ? "saving…" : "save my memories"}
          </button>
          <button
            type="button"
            onClick={onPass}
            className="jumi-btn-secondary flex-1 flex items-center justify-center gap-2"
            data-ocid="album.pass_button"
          >
            <Send className="w-4 h-4" />
            pass to next friend 💌
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function PassAnimation({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-7xl"
        initial={{ x: "-40vw", opacity: 0, scale: 0.7, rotate: -15 }}
        animate={{
          x: "40vw",
          opacity: [0, 1, 1, 0],
          scale: [0.7, 1.2, 1.1, 0.8],
          rotate: [-15, 5, -5, 15],
        }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
        onAnimationComplete={onDone}
      >
        ✉️
      </motion.div>
      <motion.p
        className="absolute bottom-1/3 font-caveat text-2xl text-center px-8"
        style={{ fontFamily: "Caveat, cursive", color: "#A8D672" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.6, delay: 0.2 }}
      >
        passing the album along… 💌
      </motion.p>
    </motion.div>
  );
}

export function AlbumPage() {
  const { id } = useParams({ from: "/album/$id" });
  const { data: album, isLoading, refetch } = useAlbum(id);
  const passAlbum = usePassAlbum();
  const [showPassAnim, setShowPassAnim] = useState(false);

  const currentHolderIdx = album ? Number(album.currentHolderIdx) : 0;
  const isCompleted = album?.completed ?? false;
  const themeEmoji = album ? (THEME_EMOJI[album.theme] ?? "📓") : "📓";

  async function handlePass() {
    if (!album) return;
    setShowPassAnim(true);
    await passAlbum.mutateAsync(album.id as AlbumId);
    setTimeout(() => {
      setShowPassAnim(false);
      refetch();
    }, 1900);
  }

  return (
    <Layout>
      <div data-ocid="album.page" className="space-y-5 pb-10">
        {/* Back button as StampCard */}
        <Link to="/albums" data-ocid="album.back_link">
          <StampCard
            label="← back"
            rotation={-1}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="text-lg">📓</span>
          </StampCard>
        </Link>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : album ? (
          <>
            {/* Cover card */}
            <div
              className="relative rounded-3xl overflow-hidden border-2 border-[#A8D672]/30 charm-shadow"
              data-ocid="album.cover_card"
            >
              <div className="jumi-gingham absolute inset-0 opacity-50" />
              <TapeStrip
                color="yellow"
                width={110}
                angle={-3}
                className="top-2 left-8"
              />
              <div className="relative px-6 py-6 space-y-2">
                <div className="flex items-start gap-3 flex-wrap">
                  <span className="text-3xl">{themeEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1
                        className="font-display font-bold text-2xl lowercase"
                        style={{ color: "#3D2C1E" }}
                      >
                        {album.name}
                      </h1>
                      <Badge
                        variant={isCompleted ? "secondary" : "default"}
                        className="rounded-full text-xs px-3 shrink-0"
                      >
                        {isCompleted ? "completed ✓" : "✈️ passing"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-body">
                      {album.theme} • {album.memberQueue.length} friends •{" "}
                      {album.entries.length} entr
                      {album.entries.length !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-body text-foreground/80">
                  {isCompleted ? (
                    <span className="text-[#E85A5A]">
                      🎉 this album has completed its journey!
                    </span>
                  ) : (
                    <>
                      <span className="text-muted-foreground">now with: </span>
                      <span className="font-semibold">
                        {MEMBER_EMOJI[currentHolderIdx % MEMBER_EMOJI.length]}{" "}
                        friend {currentHolderIdx + 1}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Member trail */}
            <div
              className="bg-card border border-border rounded-2xl px-4 py-3"
              data-ocid="album.member_trail"
            >
              <p
                className="font-caveat text-[13px] text-muted-foreground mb-3"
                style={{ fontFamily: "Caveat, cursive" }}
              >
                album journey
              </p>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {album.memberQueue.map((member, memberPos) => (
                  <div
                    key={member.toText()}
                    className="flex items-center gap-1"
                  >
                    <MemberAvatar
                      index={memberPos}
                      isActive={!isCompleted && memberPos === currentHolderIdx}
                      isPast={isCompleted || memberPos < currentHolderIdx}
                    />
                    {memberPos < album.memberQueue.length - 1 && (
                      <div
                        className={`w-6 h-0.5 shrink-0 rounded-full transition-all ${isCompleted || memberPos < currentHolderIdx ? "bg-[#E85A5A]/60" : "bg-border"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Completed banner */}
            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-3xl px-6 py-5 text-center border-2 border-[#A8D672]/20 bg-[#EAF5E3]"
                  data-ocid="album.completed_banner"
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <h2
                    className="font-caveat text-xl"
                    style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
                  >
                    this album has been everywhere!
                  </h2>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    {album.memberQueue.length} friends, {album.entries.length}{" "}
                    memories, one magical journey 🌸
                  </p>
                  <div className="flex justify-center gap-2 mt-3 text-xl">
                    {["🍓", "✨", "🍀", "💗", "🌸"].map((e) => (
                      <motion.span
                        key={`completed-${e}`}
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 1.2,
                          delay:
                            ["🍓", "✨", "🍀", "💗", "🌸"].indexOf(e) * 0.15,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        {e}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isCompleted && (
              <AddContentPanel
                albumId={album.id as AlbumId}
                onPass={handlePass}
              />
            )}

            {/* Entries as PolaroidFrame 2-col grid */}
            {album.entries.length > 0 ? (
              <div className="space-y-4" data-ocid="album.entries_timeline">
                <div className="flex flex-col items-center gap-1">
                  <ImageDivider variant="milkshake" className="my-2" />
                  <p
                    className="font-caveat text-[15px] text-muted-foreground"
                    style={{ fontFamily: "Caveat, cursive" }}
                  >
                    ✨ memories
                  </p>
                  <ImageDivider variant="milkshake" className="my-2" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {album.entries.map((entry) => (
                    <EntryCard
                      key={String(entry.addedAt)}
                      entry={entry}
                      index={album.entries.indexOf(entry)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                data-ocid="album.empty_state"
                className="flex flex-col items-center justify-center py-16 gap-4 text-center"
              >
                <motion.span
                  className="text-6xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  📓
                </motion.span>
                <div className="space-y-1">
                  <p
                    className="font-caveat text-xl"
                    style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
                  >
                    no memories yet
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    be the first to add photos to this album 🌸
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            data-ocid="album.not_found"
            className="py-20 text-center space-y-3"
          >
            <span className="text-5xl block">😢</span>
            <h1
              className="font-display font-bold text-xl lowercase"
              style={{ color: "#3D2C1E" }}
            >
              album not found
            </h1>
            <Link
              to="/albums"
              className="text-sm text-[#A8D672] font-body underline"
            >
              back to albums
            </Link>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPassAnim && (
          <PassAnimation onDone={() => setShowPassAnim(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
