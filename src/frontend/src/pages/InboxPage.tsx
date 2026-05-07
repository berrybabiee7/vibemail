import { ImageDivider } from "@/components/ImageDivider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { EnvelopeCard } from "../components/EnvelopeCard";
import { FruitCard, StampCard, TapeStrip } from "../components/JumiComponents";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/use-auth";
import { useInbox, useMyProfile } from "../hooks/use-backend";

// ─── Tile type config (cycles by index % 4) ────────────────────────────────
const TILE_TYPES = [
  {
    label: "fruit label",
    icon: "🍀",
    bgClass: "bg-[#EAF5E3] border-[#A8D672]",
    senderColor: "#E85A5A",
  },
  {
    label: "mini parcel",
    icon: "📦",
    bgClass: "bg-[#EADBC8] border-[#C4A882]",
    senderColor: "#7A5C4A",
  },
  {
    label: "drink cup",
    icon: "🧃",
    bgClass: "bg-[#EAF5E3] border-[#A8D672]",
    senderColor: "#3D7A4A",
  },
  {
    label: "stamp sq",
    icon: "📮",
    bgClass: "bg-[#FFF6E9] border-[#F7C6C7]",
    senderColor: "#E85A5A",
  },
] as const;

function InboxSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-5" data-ocid="inbox.loading_state">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function getStableRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const mag = 2 + (Math.abs(h) % 3);
  return h % 2 === 0 ? mag : -mag;
}

export function InboxPage() {
  const { isAuthenticated, isLoading: authLoading, principal } = useAuth();
  const navigate = useNavigate();

  const receiverLink = principal?.toText() ?? null;
  const {
    data: letters,
    isLoading,
    refetch,
    isFetching,
  } = useInbox(receiverLink);
  const { data: myProfile } = useMyProfile();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, authLoading, navigate]);

  const unreadCount = letters?.filter((l) => !l.isRead).length ?? 0;
  const displayName =
    myProfile?.name || (principal ? `${principal.toText().slice(0, 10)}…` : "");

  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <InboxSkeletonGrid />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Paper texture bg overlay */}
      <div
        className="min-h-screen"
        style={{
          background: "url('/assets/paper/paper-graph.jpg') repeat, #FFF6E9",
          backgroundBlendMode: "soft-light",
          backgroundSize: "220px 220px, auto",
        }}
      >
        <div
          className="flex flex-col gap-6 max-w-2xl mx-auto px-4 py-6"
          data-ocid="inbox.page"
        >
          {/* ─── Title row with TapeStrip ─── */}
          <div className="relative flex items-center gap-3 mb-2">
            <TapeStrip
              color="yellow"
              width={220}
              angle={-3}
              className="top-1/2 left-0 -translate-y-1/2"
            />
            <div className="relative z-10 flex items-center gap-3">
              <span className="text-4xl drop-shadow-sm">✉️</span>
              <div>
                <h1
                  className="font-display font-bold text-[28px] lowercase leading-tight"
                  style={{ color: "#E85A5A" }}
                >
                  my inbox ✉️
                </h1>
                {displayName && (
                  <p className="font-body text-sm" style={{ color: "#7A5C4A" }}>
                    letters for {displayName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Controls row ─── */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Badge
                    className="rounded-full bg-[#F6E27F] text-[#3D2C1E] font-body font-bold text-xs px-3 py-1 border border-[#E8C830]"
                    data-ocid="inbox.unread_badge"
                  >
                    ✨ {unreadCount} new!
                  </Badge>
                </motion.div>
              )}
              {letters && letters.length > 0 && (
                <span
                  className="text-sm font-body"
                  style={{ color: "#7A5C4A", fontFamily: "Caveat, cursive" }}
                >
                  {letters.length} letter{letters.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching || isLoading}
              data-ocid="inbox.refresh_button"
              className="rounded-full font-body text-xs gap-1.5 border-[#A8D672] text-[#3D7A4A] hover:bg-[#EAF5E3]"
            >
              <RefreshCw
                className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
              />
              refresh
            </Button>
          </div>

          {/* ─── Divider ─── */}
          <ImageDivider variant="milkshake" className="my-1" />

          {/* ─── Letter grid / states ─── */}
          {isLoading ? (
            <InboxSkeletonGrid />
          ) : !letters || letters.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-6 py-16"
              data-ocid="inbox.empty_state"
            >
              {/* Decorative FruitCard + StampCard around empty message */}
              <div className="relative flex items-center justify-center">
                {/* Left decoration */}
                <div className="absolute -left-24 top-0">
                  <FruitCard
                    fruitEmoji="🍎"
                    rotation={-8}
                    cycle={1}
                    className="w-24 opacity-70"
                  >
                    <span className="text-2xl block text-center">📭</span>
                  </FruitCard>
                </div>
                {/* Center message */}
                <div className="text-center px-4">
                  <span
                    className="text-7xl block mb-3"
                    style={{
                      filter: "drop-shadow(0 4px 12px rgba(168,214,114,0.3))",
                    }}
                  >
                    💌
                  </span>
                  <p
                    className="font-display font-bold text-xl mb-1"
                    style={{
                      color: "#3D2C1E",
                      fontFamily: "Caveat, cursive",
                      fontSize: "26px",
                    }}
                  >
                    no letters yet 🍃
                  </p>
                  <p className="font-body text-sm" style={{ color: "#7A5C4A" }}>
                    share your inbox link with a bestie so they can send you
                    adorable vibe mails ✨
                  </p>
                </div>
                {/* Right decoration */}
                <div className="absolute -right-24 top-0">
                  <StampCard
                    label="Letters"
                    rotation={6}
                    className="opacity-70"
                  >
                    <span className="text-2xl block text-center">📮</span>
                  </StampCard>
                </div>
              </div>

              {receiverLink && (
                <div className="w-full max-w-xs">
                  <p
                    className="text-xs font-body text-center mb-2"
                    style={{ color: "#7A5C4A", fontFamily: "Caveat, cursive" }}
                  >
                    your inbox address 🔗
                  </p>
                  <button
                    type="button"
                    data-ocid="inbox.copy_link_button"
                    className="w-full rounded-xl px-3 py-2 text-xs font-mono truncate text-left transition-colors"
                    style={{
                      background: "rgba(234,219,200,0.5)",
                      border: "1px dashed #C4A882",
                      color: "#7A5C4A",
                    }}
                    title="Click to copy your inbox address"
                    onClick={() => navigator.clipboard.writeText(receiverLink)}
                  >
                    {`${receiverLink.slice(0, 30)}…`}
                  </button>
                  <p
                    className="text-[10px] text-center mt-1 font-body"
                    style={{ color: "#A89078" }}
                  >
                    share this with friends so they can send you VibeMail
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {/* Recent letters section */}
              <div className="grid grid-cols-2 gap-5">
                <AnimatePresence>
                  {letters
                    .slice(0, Math.ceil(letters.length / 2))
                    .map((letter, i) => {
                      const tile = TILE_TYPES[i % 4];
                      const rot = getStableRotation(letter.id);
                      return (
                        <motion.div
                          key={letter.id}
                          initial={{ opacity: 0, y: 24, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.06 }}
                          className="relative"
                          style={{ transform: `rotate(${rot}deg)` }}
                          data-ocid={`inbox.item.${i + 1}`}
                        >
                          {!letter.isRead && (
                            <span
                              className="absolute -top-2 -right-2 z-20 text-[10px] font-display font-bold px-2 py-0.5 rounded-full shadow-md select-none"
                              style={{
                                background: "#F6E27F",
                                color: "#3D2C1E",
                                border: "1px solid #E8C830",
                              }}
                              aria-label="Unread"
                              data-ocid={`inbox.new_badge.${i + 1}`}
                            >
                              new! ✨
                            </span>
                          )}
                          {/* Tile type-specific wrapper */}
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                to: "/letter/$id",
                                params: { id: letter.id },
                              })
                            }
                            data-ocid={`inbox.card.${i + 1}`}
                            className={`relative w-full text-left overflow-hidden border-2 rounded-[20px] p-4 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group ${tile.bgClass}`}
                            style={{
                              boxShadow:
                                "0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.10)",
                            }}
                          >
                            {/* Parcel dashed border detail */}
                            {i % 4 === 1 && (
                              <div
                                className="absolute inset-2 rounded-[14px] pointer-events-none"
                                style={{ border: "2px dashed #C4A88266" }}
                                aria-hidden="true"
                              />
                            )}
                            {/* Drink cup yellow stripe */}
                            {i % 4 === 2 && (
                              <div
                                className="absolute top-0 left-0 right-0 h-2 rounded-t-[18px] pointer-events-none"
                                style={{ background: "rgba(246,226,127,0.6)" }}
                                aria-hidden="true"
                              />
                            )}
                            {/* Stamp square: Caveat 'Letters' label corner */}
                            {i % 4 === 3 && (
                              <span
                                className="absolute bottom-2 right-2 text-[10px] select-none"
                                style={{
                                  fontFamily: "Caveat, cursive",
                                  color: "#E85A5A",
                                  opacity: 0.8,
                                }}
                                aria-hidden="true"
                              >
                                Letters
                              </span>
                            )}

                            <div className="flex flex-col gap-2 items-center">
                              {/* Preview envelope icon (80×80) */}
                              <div
                                className="flex items-center justify-center rounded-xl overflow-hidden"
                                style={{
                                  width: 80,
                                  height: 80,
                                  background: "rgba(255,255,255,0.55)",
                                }}
                              >
                                {letter.photos.length > 0 ? (
                                  <span className="text-3xl">🖼️</span>
                                ) : (
                                  <span className="text-3xl">✉️</span>
                                )}
                              </div>

                              {/* Sender name Caveat 12px */}
                              <p
                                className="text-center leading-tight truncate w-full"
                                style={{
                                  fontFamily: "Caveat, cursive",
                                  fontSize: "13px",
                                  color: tile.senderColor,
                                }}
                              >
                                {letter.note.slice(0, 28)}
                                {letter.note.length > 28 ? "…" : ""}
                              </p>

                              {/* Tiny type icon */}
                              <span className="text-base" aria-hidden="true">
                                {tile.icon}
                              </span>
                            </div>

                            {/* Hover shimmer */}
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[20px]"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 70%)",
                              }}
                            />
                          </button>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>

              {/* ─── Divider between recent / older ─── */}
              {letters.length > Math.ceil(letters.length / 2) && (
                <ImageDivider variant="cones" className="my-2" />
              )}

              {/* Older letters section */}
              {letters.length > Math.ceil(letters.length / 2) && (
                <div className="grid grid-cols-2 gap-5">
                  <AnimatePresence>
                    {letters
                      .slice(Math.ceil(letters.length / 2))
                      .map((letter, i) => {
                        const globalIdx = Math.ceil(letters.length / 2) + i;
                        const tile = TILE_TYPES[globalIdx % 4];
                        const rot = getStableRotation(letter.id);
                        return (
                          <motion.div
                            key={letter.id}
                            initial={{ opacity: 0, y: 24, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.06 }}
                            className="relative"
                            style={{ transform: `rotate(${rot}deg)` }}
                            data-ocid={`inbox.item.${globalIdx + 1}`}
                          >
                            {!letter.isRead && (
                              <span
                                className="absolute -top-2 -right-2 z-20 text-[10px] font-display font-bold px-2 py-0.5 rounded-full shadow-md select-none"
                                style={{
                                  background: "#F6E27F",
                                  color: "#3D2C1E",
                                  border: "1px solid #E8C830",
                                }}
                                aria-label="Unread"
                                data-ocid={`inbox.new_badge.${globalIdx + 1}`}
                              >
                                new! ✨
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                navigate({
                                  to: "/letter/$id",
                                  params: { id: letter.id },
                                })
                              }
                              data-ocid={`inbox.card.${globalIdx + 1}`}
                              className={`relative w-full text-left overflow-hidden border-2 rounded-[20px] p-4 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group ${tile.bgClass}`}
                              style={{
                                boxShadow:
                                  "0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.10)",
                              }}
                            >
                              {i % 4 === 1 && (
                                <div
                                  className="absolute inset-2 rounded-[14px] pointer-events-none"
                                  style={{ border: "2px dashed #C4A88266" }}
                                  aria-hidden="true"
                                />
                              )}
                              {i % 4 === 2 && (
                                <div
                                  className="absolute top-0 left-0 right-0 h-2 rounded-t-[18px] pointer-events-none"
                                  style={{
                                    background: "rgba(246,226,127,0.6)",
                                  }}
                                  aria-hidden="true"
                                />
                              )}
                              {i % 4 === 3 && (
                                <span
                                  className="absolute bottom-2 right-2 text-[10px] select-none"
                                  style={{
                                    fontFamily: "Caveat, cursive",
                                    color: "#E85A5A",
                                    opacity: 0.8,
                                  }}
                                  aria-hidden="true"
                                >
                                  Letters
                                </span>
                              )}
                              <div className="flex flex-col gap-2 items-center">
                                <div
                                  className="flex items-center justify-center rounded-xl overflow-hidden"
                                  style={{
                                    width: 80,
                                    height: 80,
                                    background: "rgba(255,255,255,0.55)",
                                  }}
                                >
                                  {letter.photos.length > 0 ? (
                                    <span className="text-3xl">🖼️</span>
                                  ) : (
                                    <span className="text-3xl">✉️</span>
                                  )}
                                </div>
                                <p
                                  className="text-center leading-tight truncate w-full"
                                  style={{
                                    fontFamily: "Caveat, cursive",
                                    fontSize: "13px",
                                    color: tile.senderColor,
                                  }}
                                >
                                  {letter.note.slice(0, 28)}
                                  {letter.note.length > 28 ? "…" : ""}
                                </p>
                                <span className="text-base" aria-hidden="true">
                                  {tile.icon}
                                </span>
                              </div>
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[20px]"
                                style={{
                                  background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 70%)",
                                }}
                              />
                            </button>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* ─── Footer divider ─── */}
          <ImageDivider variant="cones" className="mt-2" />
        </div>
      </div>
    </Layout>
  );
}
