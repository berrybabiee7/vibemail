import { ImageDivider } from "@/components/ImageDivider";
import {
  BadgePin,
  FruitCard,
  StampCard,
  TapeStrip,
} from "@/components/JumiComponents";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { PenLine, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { EnvelopeCard } from "../components/EnvelopeCard";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/use-auth";
import { useSent } from "../hooks/use-backend";
import type { Letter } from "../types";

// Deterministic rotation from letter id string
function hashRotation(id: string, min = -4, max = 4): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const abs = Math.abs(h);
  return min + (abs % ((max - min) * 10)) / 10;
}

const TILE_FRUITS = ["🍎", "📦", "🧃", "📮"];
const TILE_CYCLES = [0, 1, 2, 3]; // FruitCard cycle indexes

function SentTile({ letter, index }: { letter: Letter; index: number }) {
  const navigate = useNavigate();
  const fruit = TILE_FRUITS[index % TILE_FRUITS.length];
  const cycle = TILE_CYCLES[index % TILE_CYCLES.length];
  const rot = hashRotation(letter.id, -3, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      data-ocid={`sent.item.${index + 1}`}
    >
      <FruitCard
        fruitEmoji={fruit}
        rotation={rot}
        cycle={cycle}
        onClick={() =>
          navigate({ to: "/letter/$id", params: { id: letter.id } })
        }
        className="w-full"
      >
        {/* Sent badge */}
        <div className="absolute -top-2 -left-2 z-20">
          <span
            className="inline-block px-2 py-0.5 rounded-full font-caveat text-[10px]"
            style={{
              background: "rgba(247,198,199,0.95)",
              color: "#3D2C1E",
              fontFamily: "Caveat, cursive",
              border: "1px solid rgba(232,90,90,0.2)",
            }}
          >
            {letter.isRead ? "✓ seen" : "sent 📮"}
          </span>
        </div>
        {/* EnvelopeCard nested */}
        <div className="pointer-events-none">
          <EnvelopeCard letter={letter} isInbox={false} onClick={() => {}} />
        </div>
        {/* Recipient label */}
        <p
          className="mt-2 font-caveat text-[12px] truncate"
          style={{ fontFamily: "Caveat, cursive", color: "#7A5C4A" }}
        >
          → {letter.receiverLink.slice(0, 18)}…
        </p>
      </FruitCard>
    </motion.div>
  );
}

function SentSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-5" data-ocid="sent.loading_state">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-[20px]" />
      ))}
    </div>
  );
}

function SentEmptyState({ onCompose }: { onCompose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-6 py-16"
      data-ocid="sent.empty_state"
    >
      <div className="flex items-center gap-4">
        <FruitCard fruitEmoji="🌿" rotation={-4} cycle={1} className="w-24">
          <div className="flex items-center justify-center h-16 text-3xl">
            📮
          </div>
        </FruitCard>
        <StampCard label="no letters yet" rotation={3}>
          <div className="text-2xl px-2 py-1">🌿</div>
        </StampCard>
      </div>
      <div className="text-center max-w-xs">
        <p
          className="font-caveat text-xl mb-1"
          style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
        >
          no sent letters yet 🌿
        </p>
        <p className="font-body text-sm text-muted-foreground">
          send your first vibemail and make a bestie's day ✨
        </p>
      </div>
      <button
        type="button"
        onClick={onCompose}
        className="jumi-btn-primary flex items-center gap-2"
        data-ocid="sent.empty_compose_button"
      >
        <PenLine className="w-4 h-4" />
        write a vibemail
      </button>
    </motion.div>
  );
}

export function SentPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: letters, isLoading, refetch, isFetching } = useSent();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <SentSkeletonGrid />
        </div>
      </Layout>
    );
  }

  // Partition into this-week and older
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeek: Letter[] = [];
  const older: Letter[] = [];
  for (const l of letters ?? []) {
    const sent = Number(l.createdAt / 1_000_000n);
    if (now - sent < oneWeekMs) thisWeek.push(l);
    else older.push(l);
  }

  return (
    <Layout>
      <div
        className="flex flex-col gap-5 max-w-4xl mx-auto"
        data-ocid="sent.page"
      >
        {/* Header */}
        <div className="relative rounded-2xl overflow-visible px-5 py-4 jumi-gingham">
          <TapeStrip
            color="yellow"
            width={120}
            angle={-3}
            className="-top-2 left-8"
          />
          <TapeStrip
            color="pink"
            width={80}
            angle={4}
            className="-top-2 right-12"
          />
          <div className="flex items-center justify-between mt-1">
            <h1
              className="font-display text-[28px] lowercase"
              style={{ color: "#A8D672" }}
            >
              sent letters 📮
            </h1>
            {letters && letters.length > 0 && (
              <span className="font-body text-sm text-muted-foreground">
                {letters.length} letter{letters.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || isLoading}
            data-ocid="sent.refresh_button"
            className="rounded-full font-body text-xs gap-1.5"
          >
            <RefreshCw
              className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
            />
            refresh
          </Button>
          <button
            type="button"
            onClick={() => navigate({ to: "/compose" })}
            className="jumi-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4"
            data-ocid="sent.compose_button"
          >
            <PenLine className="w-3 h-3" />
            new letter
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <SentSkeletonGrid />
        ) : !letters || letters.length === 0 ? (
          <SentEmptyState onCompose={() => navigate({ to: "/compose" })} />
        ) : (
          <>
            {thisWeek.length > 0 && (
              <section>
                <p
                  className="font-caveat text-[14px] mb-3 pl-1"
                  style={{ fontFamily: "Caveat, cursive", color: "#7A5C4A" }}
                >
                  this week
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AnimatePresence>
                    {thisWeek.map((l, i) => (
                      <SentTile key={l.id} letter={l} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {thisWeek.length > 0 && older.length > 0 && (
              <ImageDivider variant="floats" className="my-1" />
            )}

            {older.length > 0 && (
              <section>
                <p
                  className="font-caveat text-[14px] mb-3 pl-1"
                  style={{ fontFamily: "Caveat, cursive", color: "#7A5C4A" }}
                >
                  this month
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AnimatePresence>
                    {older.map((l, i) => (
                      <SentTile
                        key={l.id}
                        letter={l}
                        index={thisWeek.length + i}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Footer divider */}
            <ImageDivider variant="floats" className="mt-2" />
          </>
        )}
      </div>
    </Layout>
  );
}
