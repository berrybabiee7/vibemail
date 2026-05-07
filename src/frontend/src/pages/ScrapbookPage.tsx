import { ImageDivider } from "@/components/ImageDivider";
import {
  PolaroidFrame,
  StampCard,
  TapeStrip,
} from "@/components/JumiComponents";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useParams } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Layout } from "../components/Layout";
import { useAddScrapbookPost, useScrapbook } from "../hooks/use-backend";
import type { ScrapbookPost } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function principalToName(p: string): string {
  return `${p.slice(0, 6)}…${p.slice(-4)}`;
}

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hashRotation(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const abs = Math.abs(h);
  const base = abs % 9;
  return base <= 4 ? base - 2 : -(base - 6); // -4 to 4 range
}

function avatarBg(seed: string): string {
  const colors = ["#FFF6E9", "#EAF5E3", "#FFF0F0", "#FFFBEC"];
  return colors[seed.charCodeAt(0) % colors.length];
}

function AvatarPill({
  principal,
  size = "sm",
}: { principal: string; size?: "sm" | "lg" }) {
  const name = principalToName(principal);
  const cls = size === "lg" ? "w-9 h-9 text-xs" : "w-6 h-6 text-[9px]";
  const bg = avatarBg(principal);
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold shrink-0 border-2 border-card",
        cls,
      )}
      style={{ background: bg, color: "#3D2C1E" }}
      title={principal}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Post Card ──────────────────────────────────────────────────────────────

const TAPE_COLORS = ["yellow", "pink", "green"] as const;

function PostCard({ post, index }: { post: ScrapbookPost; index: number }) {
  const [hovered, setHovered] = useState(false);
  const angle = hashRotation(post.id);
  const tapeColor = TAPE_COLORS[index % TAPE_COLORS.length];
  const hasPhoto = !!post.photoKey;

  return (
    <div
      data-ocid={`scrapbook.post.item.${index + 1}`}
      className="break-inside-avoid mb-5 relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* TapeStrip pinning the card */}
      <TapeStrip
        color={tapeColor}
        width={72}
        angle={angle * 0.5}
        className="-top-2 left-1/2 -translate-x-1/2"
      />

      <div
        className="jumi-card overflow-hidden"
        style={{
          transform: `rotate(${angle * 0.4}deg)`,
          transition: "transform 0.2s ease",
        }}
      >
        {/* Caveat date label */}
        <div className="px-3 pt-3 pb-1">
          <p
            className="font-caveat text-[12px]"
            style={{ fontFamily: "Caveat, cursive", color: "#7A5C4A" }}
          >
            {formatDate(post.createdAt)}
          </p>
        </div>

        {/* Photo as PolaroidFrame or placeholder */}
        {hasPhoto ? (
          <div className="px-2 pb-1">
            <PolaroidFrame
              src={post.photoKey}
              alt="Memory"
              rotation={angle * 0.2}
              className="w-full"
            >
              <div className="w-full aspect-[4/3] bg-muted/30 flex items-center justify-center">
                <span className="text-4xl">📸</span>
              </div>
            </PolaroidFrame>
          </div>
        ) : (
          <div className="mx-2 mb-1 aspect-square bg-muted/30 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-4xl">📸</span>
            <span className="text-[10px] font-body">photo memory</span>
          </div>
        )}

        {/* Note text */}
        {post.note && (
          <div className="px-3 py-2.5 bg-card">
            <p className="text-xs font-body text-foreground/80 line-clamp-3 italic jumi-paper px-2 py-1 rounded">
              &quot;{post.note}&quot;
            </p>
          </div>
        )}

        {/* Hover meta overlay */}
        <div
          className={cn(
            "px-3 pb-2 flex items-center gap-1.5 transition-opacity duration-200",
            hovered ? "opacity-100" : "opacity-0",
          )}
        >
          <AvatarPill principal={post.author.toText()} />
          <p
            className="font-caveat text-[11px] truncate"
            style={{ fontFamily: "Caveat, cursive", color: "#7A5C4A" }}
          >
            {principalToName(post.author.toText())}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Add Post Sheet ──────────────────────────────────────────────────────────

interface AddPostSheetProps {
  scrapbookId: string;
  open: boolean;
  onClose: () => void;
}

function AddPostSheet({ scrapbookId, open, onClose }: AddPostSheetProps) {
  const [note, setNote] = useState("");
  const { mutate: addPost, isPending } = useAddScrapbookPost();

  function handleSubmit() {
    addPost(
      { scrapbookId, photoKey: "", note },
      {
        onSuccess: () => {
          setNote("");
          onClose();
        },
      },
    );
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden={true}
      />
      <div
        data-ocid="scrapbook.add_post_sheet"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[#FFF6E9] border-t-2 border-[#A8D672]/30 shadow-xl max-w-lg mx-auto"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <ImageDivider
          variant="cones"
          className="my-1 mx-4 rounded-full"
          height={32}
        />

        <div className="px-5 pt-3 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3
              className="font-caveat text-[20px]"
              style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
            >
              🌸 add to the wall
            </h3>
            <button
              type="button"
              onClick={onClose}
              data-ocid="scrapbook.add_post_close_button"
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Photo upload */}
          <div>
            <span
              className="font-caveat text-[13px] text-muted-foreground mb-1.5 block"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              📷 photo
            </span>
            <div
              data-ocid="scrapbook.add_post_photo_dropzone"
              className="border-2 border-dashed border-[#A8D672]/30 rounded-2xl h-28 flex flex-col items-center justify-center gap-2 bg-muted/20 cursor-pointer hover:bg-[#EAF5E3] transition-colors"
            >
              <ImagePlus className="w-7 h-7 text-[#A8D672]/60" />
              <p className="text-xs font-body text-muted-foreground">
                tap to add a photo 📸
              </p>
            </div>
          </div>

          {/* Note */}
          <div>
            <Label
              htmlFor="post-note"
              className="font-caveat text-[13px] text-muted-foreground mb-1.5 block"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              🖊 note
            </Label>
            <Textarea
              id="post-note"
              data-ocid="scrapbook.add_post_note_textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="add a little memory note… 🍀"
              className="jumi-paper resize-none font-body text-sm h-20 rounded-xl border-[#A8D672]/20"
            />
          </div>

          <button
            type="button"
            data-ocid="scrapbook.add_post_submit_button"
            onClick={handleSubmit}
            disabled={isPending || !note.trim()}
            className="jumi-btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {isPending ? "pinning to wall… 🌸" : "pin to wall 📌"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
      `}</style>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ScrapbookPage() {
  const { id } = useParams({ from: "/scrapbook/$id" });
  const { data: scrapbook, isLoading } = useScrapbook(id);
  const [sheetOpen, setSheetOpen] = useState(false);

  const members = scrapbook?.members ?? [];
  const posts = scrapbook?.posts ?? [];

  const memberNames = members
    .slice(0, 3)
    .map((p) => principalToName(p.toText()))
    .join(", ");
  const subtitle =
    members.length > 0 ? `your wall with ${memberNames}` : "group scrapbook";

  return (
    <Layout>
      <div data-ocid="scrapbook.page" className="space-y-0 pb-24">
        {/* Header */}
        <div className="rounded-2xl overflow-visible mb-6 charm-shadow relative">
          {/* Back StampCard */}
          <div className="absolute -top-4 left-0 z-10">
            <a href="/albums">
              <StampCard
                label="← back"
                rotation={-2}
                className="cursor-pointer hover:scale-105 transition-transform"
              >
                <span className="text-lg">📚</span>
              </StampCard>
            </a>
          </div>

          <div className="jumi-gingham px-5 pt-10 pb-4 relative rounded-2xl">
            <TapeStrip
              color="green"
              width={100}
              angle={-3}
              className="top-3 left-10"
            />
            <TapeStrip
              color="pink"
              width={70}
              angle={4}
              className="top-3 right-8"
            />

            {isLoading ? (
              <div className="space-y-2 mt-2">
                <Skeleton className="h-8 w-52 rounded-xl" />
                <Skeleton className="h-4 w-36 rounded-lg" />
              </div>
            ) : scrapbook ? (
              <>
                <h1
                  className="font-display font-bold text-2xl lowercase mt-2"
                  style={{ color: "#3D2C1E" }}
                >
                  📖 {scrapbook.name}
                </h1>
                <p className="text-sm text-muted-foreground font-body mt-0.5">
                  {subtitle}
                </p>
              </>
            ) : (
              <h1
                className="font-display font-bold text-2xl lowercase mt-2"
                style={{ color: "#3D2C1E" }}
              >
                scrapbook not found 😢
              </h1>
            )}
          </div>

          {/* Member avatars */}
          <div className="bg-card px-5 py-3 flex items-center gap-3 rounded-b-2xl">
            <div className="flex items-center">
              {isLoading ? (
                <div className="flex gap-1">
                  {["av-a", "av-b", "av-c"].map((k) => (
                    <Skeleton key={k} className="w-9 h-9 rounded-full" />
                  ))}
                </div>
              ) : (
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((p) => (
                    <AvatarPill
                      key={`avatar-${p.toText()}`}
                      principal={p.toText()}
                      size="lg"
                    />
                  ))}
                  {members.length > 5 && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-display font-bold text-muted-foreground border-2 border-card">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isLoading && scrapbook && (
              <Badge
                variant="secondary"
                className="rounded-full text-[10px] ml-auto"
              >
                {posts.length} memor{posts.length === 1 ? "y" : "ies"}
              </Badge>
            )}
          </div>
        </div>

        {/* Posts wall */}
        {isLoading ? (
          <div
            className="columns-2 sm:columns-3 lg:columns-4"
            style={{ columnGap: "12px" }}
          >
            {["p-a", "p-b", "p-c", "p-d", "p-e", "p-f"].map((k, ki) => (
              <div key={k} className="break-inside-avoid mb-3">
                <Skeleton
                  className="rounded-2xl"
                  style={{ height: `${[160, 220, 180, 200, 175, 210][ki]}px` }}
                />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div
            data-ocid="scrapbook.wall"
            className="columns-2 sm:columns-3 lg:columns-4"
            style={{ columnGap: "12px" }}
          >
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        ) : (
          <div
            data-ocid="scrapbook.empty_state"
            className="flex flex-col items-center justify-center py-16 gap-5 text-center"
          >
            <div className="relative">
              <motion.span
                className="text-7xl block"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                🍀
              </motion.span>
              <span
                className="absolute -top-2 -right-4 text-3xl opacity-70"
                style={{ animation: "float 3.5s ease-in-out infinite 0.5s" }}
              >
                🍀
              </span>
              <span
                className="absolute -bottom-2 -left-5 text-2xl opacity-50"
                style={{ animation: "float 4s ease-in-out infinite 1s" }}
              >
                🍀
              </span>
            </div>
            <div className="space-y-1">
              <p
                className="font-caveat text-2xl"
                style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
              >
                add your first memory 🍀
              </p>
              <p className="text-sm text-muted-foreground font-body max-w-xs">
                start filling this wall with photos, notes, and memories with
                your besties!
              </p>
            </div>
            <button
              type="button"
              data-ocid="scrapbook.empty_add_button"
              onClick={() => setSheetOpen(true)}
              disabled={!scrapbook}
              className="jumi-btn-primary flex items-center gap-2"
            >
              <ImagePlus className="w-4 h-4" />
              add first memory
            </button>
          </div>
        )}
      </div>

      {/* Floating add button */}
      {scrapbook && posts.length > 0 && (
        <div className="fixed bottom-20 right-4 z-30 md:bottom-6 md:right-6">
          <button
            type="button"
            data-ocid="scrapbook.add_post_fab"
            onClick={() => setSheetOpen(true)}
            className="jumi-btn-primary w-14 h-14 rounded-full shadow-xl charm-shadow text-2xl p-0 flex items-center justify-center hover:scale-110 transition-smooth"
            aria-label="Add to wall"
          >
            📸
          </button>
        </div>
      )}

      <AddPostSheet
        scrapbookId={id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </Layout>
  );
}
