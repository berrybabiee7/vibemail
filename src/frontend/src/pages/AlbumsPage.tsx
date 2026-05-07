import { ImageDivider } from "@/components/ImageDivider";
import {
  BadgePin,
  FruitCard,
  StampCard,
  TapeStrip,
} from "@/components/JumiComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { BookImage, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Layout } from "../components/Layout";
import {
  useCreateAlbum,
  useCreateScrapbook,
  useMyAlbums,
  useMyProfile,
  useMyScrapbooks,
} from "../hooks/use-backend";
import type { Album, Scrapbook } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function hashRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const abs = Math.abs(h);
  const base = abs % 9; // 0-8
  return base <= 4 ? base : -(base - 4); // -4 to 4 range
}

const FRUIT_EMOJIS = ["🍓", "🍎", "🍊", "🥝", "🍒", "🍋"];

// ─── Scrapbook FruitCard ─────────────────────────────────────────────────────

function ScrapbookFruitCard({ sb, index }: { sb: Scrapbook; index: number }) {
  const fruit = FRUIT_EMOJIS[index % FRUIT_EMOJIS.length];
  const rot = hashRotation(sb.id);
  const lastPost = sb.posts.length > 0 ? sb.posts[sb.posts.length - 1] : null;

  return (
    <Link
      to="/scrapbook/$id"
      params={{ id: sb.id }}
      data-ocid={`albums.scrapbook_item.${index + 1}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.06 }}
      >
        <FruitCard
          fruitEmoji={fruit}
          rotation={rot}
          cycle={index % 4}
          className="w-full"
        >
          <div className="min-w-0">
            <p
              className="font-caveat text-[16px] font-bold line-clamp-1"
              style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
            >
              {sb.name}
            </p>
            <p className="text-[11px] font-body text-muted-foreground mt-0.5">
              {sb.members.length + 1} member{sb.members.length !== 0 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <BadgePin
                icon="📝"
                title={`${sb.posts.length} posts`}
                className="scale-75 origin-left"
              />
              {lastPost && (
                <span className="text-[10px] font-body text-muted-foreground">
                  {formatRelativeDate(lastPost.createdAt)}
                </span>
              )}
            </div>
          </div>
        </FruitCard>
      </motion.div>
    </Link>
  );
}

// ─── Album FruitCard ─────────────────────────────────────────────────────────

function AlbumFruitCard({ album, index }: { album: Album; index: number }) {
  const fruit = FRUIT_EMOJIS[(index + 2) % FRUIT_EMOJIS.length];
  const rot = hashRotation(album.id);

  return (
    <Link
      to="/album/$id"
      params={{ id: album.id }}
      data-ocid={`albums.album_item.${index + 1}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.06 }}
      >
        <FruitCard
          fruitEmoji={fruit}
          rotation={rot}
          cycle={(index + 2) % 4}
          className="w-full"
        >
          <div className="min-w-0">
            <p
              className="font-caveat text-[16px] font-bold line-clamp-1"
              style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
            >
              {album.name}
            </p>
            <p className="text-[11px] font-body text-muted-foreground mt-0.5">
              {album.theme}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <BadgePin
                icon={album.completed ? "✓" : "📬"}
                title={album.completed ? "done!" : "passing"}
                className="scale-75 origin-left"
              />
              <span className="text-[10px] font-body text-muted-foreground">
                {album.entries.length} entr
                {album.entries.length !== 1 ? "ies" : "y"}
              </span>
            </div>
          </div>
        </FruitCard>
      </motion.div>
    </Link>
  );
}

// ─── Create Scrapbook Modal ──────────────────────────────────────────────────

interface CreateScrapbookModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateScrapbookModal({ open, onClose }: CreateScrapbookModalProps) {
  const [name, setName] = useState("");
  const { data: profile } = useMyProfile();
  const { mutate: createSB, isPending } = useCreateScrapbook();

  const besties = profile?.besties ?? [];
  const [selected, setSelected] = useState<number[]>([]);

  function toggleBestie(i: number) {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  }

  function handleCreate() {
    if (!name.trim()) return;
    createSB(
      { name: name.trim(), members: selected.map((i) => besties[i]) },
      {
        onSuccess: () => {
          setName("");
          setSelected([]);
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
        data-ocid="albums.create_scrapbook_dialog"
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-[#FFF6E9] rounded-3xl shadow-xl border-2 border-[#A8D672]/30 max-w-sm mx-auto overflow-hidden"
      >
        <div className="jumi-gingham px-5 pt-5 pb-4 relative">
          <TapeStrip
            color="green"
            width={90}
            angle={-3}
            className="-top-2 left-6"
          />
          <div className="flex items-center justify-between mt-1">
            <h2
              className="font-display font-bold text-lg lowercase"
              style={{ color: "#3D2C1E" }}
            >
              🌸 new scrapbook
            </h2>
            <button
              type="button"
              onClick={onClose}
              data-ocid="albums.create_scrapbook_close_button"
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <Label
              htmlFor="sb-name"
              className="text-xs font-caveat text-muted-foreground mb-1.5 block"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              scrapbook name
            </Label>
            <input
              id="sb-name"
              data-ocid="albums.create_scrapbook_name_input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer with the Girls 🌸"
              className="jumi-input w-full font-body text-sm"
            />
          </div>

          <div>
            <Label
              className="text-xs font-caveat text-muted-foreground mb-2 block"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              add besties
            </Label>
            {besties.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body italic">
                no besties yet — add friends from your profile first 🍓
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {besties.map((p, selPos) => {
                  const short = `${p.toText().slice(0, 6)}…`;
                  const isSelected = selected.includes(selPos);
                  return (
                    <button
                      key={p.toText()}
                      type="button"
                      data-ocid={`albums.bestie_toggle.${selPos + 1}`}
                      onClick={() => toggleBestie(selPos)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border-2 transition-smooth",
                        isSelected
                          ? "bg-[#A8D672] text-[#FFF6E9] border-[#A8D672]"
                          : "bg-muted text-muted-foreground border-transparent hover:border-[#A8D672]/30",
                      )}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              data-ocid="albums.create_scrapbook_cancel_button"
              className="jumi-btn-secondary flex-1"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending || !name.trim()}
              data-ocid="albums.create_scrapbook_confirm_button"
              className="jumi-btn-primary flex-1"
            >
              {isPending ? "creating… 🌸" : "create 🍀"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Create Album Modal ─────────────────────────────────────────────────────

const ALBUM_THEMES = [
  { value: "Summer Memories", label: "☀️ Summer Memories" },
  { value: "Birthday Surprise", label: "🎂 Birthday Surprise" },
  { value: "Trip Together", label: "🗺️ Trip Together" },
  { value: "Just Because", label: "🌸 Just Because" },
];

interface CreateAlbumModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateAlbumModal({ open, onClose }: CreateAlbumModalProps) {
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("Summer Memories");
  const { data: profile } = useMyProfile();
  const { mutate: createAlbum, isPending } = useCreateAlbum();

  const besties = profile?.besties ?? [];
  const [memberOrder, setMemberOrder] = useState<number[]>([]);

  function toggleMember(i: number) {
    setMemberOrder((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  }

  function moveMember(i: number, dir: -1 | 1) {
    const pos = memberOrder.indexOf(i);
    if (pos === -1) return;
    const next = pos + dir;
    if (next < 0 || next >= memberOrder.length) return;
    const updated = [...memberOrder];
    [updated[pos], updated[next]] = [updated[next], updated[pos]];
    setMemberOrder(updated);
  }

  function handleCreate() {
    if (!name.trim()) return;
    createAlbum(
      { name: name.trim(), theme, members: memberOrder.map((i) => besties[i]) },
      {
        onSuccess: () => {
          setName("");
          setTheme("Summer Memories");
          setMemberOrder([]);
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
        data-ocid="albums.create_album_dialog"
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-[#FFF6E9] rounded-3xl shadow-xl border-2 border-[#A8D672]/30 max-w-sm mx-auto overflow-hidden"
      >
        <div className="jumi-gingham px-5 pt-5 pb-4 relative">
          <TapeStrip
            color="pink"
            width={80}
            angle={4}
            className="-top-2 right-10"
          />
          <div className="flex items-center justify-between mt-1">
            <h2
              className="font-display font-bold text-lg lowercase"
              style={{ color: "#3D2C1E" }}
            >
              📬 new album
            </h2>
            <button
              type="button"
              onClick={onClose}
              data-ocid="albums.create_album_close_button"
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label
              htmlFor="album-name"
              className="text-xs font-caveat text-muted-foreground mb-1.5 block"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              album name
            </Label>
            <input
              id="album-name"
              data-ocid="albums.create_album_name_input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Our Summer Memories 🍓"
              className="jumi-input w-full font-body text-sm"
            />
          </div>

          <div>
            <Label
              className="text-xs font-caveat text-muted-foreground mb-1.5 block"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              occasion
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger
                data-ocid="albums.create_album_theme_select"
                className="rounded-xl border-[#A8D672]/30 font-body text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALBUM_THEMES.map((t) => (
                  <SelectItem
                    key={t.value}
                    value={t.value}
                    className="font-body text-sm"
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              className="text-xs font-caveat text-muted-foreground mb-2 block"
              style={{ fontFamily: "Caveat, cursive" }}
            >
              member order
            </Label>
            {besties.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body italic">
                no besties yet — add friends from your profile first 🍓
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {besties.map((p, memberPos) => {
                    const short = `${p.toText().slice(0, 6)}…`;
                    const isSelected = memberOrder.includes(memberPos);
                    return (
                      <button
                        key={p.toText()}
                        type="button"
                        data-ocid={`albums.album_member_toggle.${memberPos + 1}`}
                        onClick={() => toggleMember(memberPos)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border-2 transition-smooth",
                          isSelected
                            ? "bg-[#A8D672] text-[#FFF6E9] border-[#A8D672]"
                            : "bg-muted text-muted-foreground border-transparent hover:border-[#A8D672]/30",
                        )}
                      >
                        {short}
                      </button>
                    );
                  })}
                </div>
                {memberOrder.length > 0 && (
                  <div className="bg-muted/40 rounded-2xl p-2.5 space-y-1.5">
                    <p
                      className="text-[10px] font-caveat text-muted-foreground"
                      style={{ fontFamily: "Caveat, cursive" }}
                    >
                      passing order
                    </p>
                    {memberOrder.map((memberIdx, posInOrder) => {
                      const short = `${besties[memberIdx].toText().slice(0, 6)}…`;
                      return (
                        <div
                          key={besties[memberIdx].toText()}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[10px] w-4 text-muted-foreground font-body">
                            {posInOrder + 1}.
                          </span>
                          <span className="text-xs font-body text-foreground flex-1">
                            {short}
                          </span>
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveMember(memberIdx, -1)}
                              disabled={posInOrder === 0}
                              className="w-5 h-5 rounded-full bg-muted hover:bg-[#A8D672]/20 flex items-center justify-center text-[10px] disabled:opacity-30 transition-colors"
                              aria-label="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMember(memberIdx, 1)}
                              disabled={posInOrder === memberOrder.length - 1}
                              className="w-5 h-5 rounded-full bg-muted hover:bg-[#A8D672]/20 flex items-center justify-center text-[10px] disabled:opacity-30 transition-colors"
                              aria-label="Move down"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            data-ocid="albums.create_album_cancel_button"
            className="jumi-btn-secondary flex-1"
          >
            cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            data-ocid="albums.create_album_confirm_button"
            className="jumi-btn-primary flex-1"
          >
            {isPending ? "creating… 📬" : "start album 📬"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function AlbumsPage() {
  const { data: scrapbooks, isLoading: sbLoading } = useMyScrapbooks();
  const { data: albums, isLoading: albumLoading } = useMyAlbums();
  const [modalOpen, setModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);

  return (
    <Layout>
      <div data-ocid="albums.page" className="space-y-5 pb-10">
        {/* Page header */}
        <div className="relative rounded-2xl overflow-visible px-5 py-4 jumi-gingham">
          <TapeStrip
            color="pink"
            width={130}
            angle={-3}
            className="-top-2 left-6"
          />
          <TapeStrip
            color="yellow"
            width={70}
            angle={5}
            className="-top-2 right-10"
          />
          <div className="mt-1">
            <h1
              className="font-display text-[28px] lowercase"
              style={{ color: "#E85A5A" }}
            >
              my scrapbooks 📓
            </h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              group scrapbooks & pass-around albums
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="scrapbooks" className="w-full">
          <TabsList
            data-ocid="albums.tabs"
            className="w-full rounded-2xl bg-muted/60 h-11 p-1 border border-border/40"
          >
            <TabsTrigger
              value="scrapbooks"
              data-ocid="albums.scrapbooks_tab"
              className="flex-1 rounded-xl text-sm font-display font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              🌸 scrapbooks
            </TabsTrigger>
            <TabsTrigger
              value="albums"
              data-ocid="albums.albums_tab"
              className="flex-1 rounded-xl text-sm font-display font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              📬 albums
            </TabsTrigger>
          </TabsList>

          {/* ── Scrapbooks Tab ── */}
          <TabsContent value="scrapbooks" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-body">
                {sbLoading
                  ? "loading…"
                  : `${scrapbooks?.length ?? 0} wall${(scrapbooks?.length ?? 0) !== 1 ? "s" : ""}`}
              </p>
              <button
                type="button"
                data-ocid="albums.new_scrapbook_button"
                onClick={() => setModalOpen(true)}
                className="jumi-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4"
              >
                <Plus className="w-3.5 h-3.5" />
                new scrapbook
              </button>
            </div>

            {sbLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["sk-a", "sk-b", "sk-c", "sk-d"].map((k) => (
                  <Skeleton key={k} className="h-32 rounded-[20px]" />
                ))}
              </div>
            ) : scrapbooks && scrapbooks.length > 0 ? (
              <div
                data-ocid="albums.scrapbooks_list"
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {scrapbooks.map((sb, i) => (
                  <ScrapbookFruitCard key={sb.id} sb={sb} index={i} />
                ))}
              </div>
            ) : (
              <div
                data-ocid="albums.scrapbooks_empty_state"
                className="flex flex-col items-center justify-center py-12 gap-5 text-center"
              >
                <div className="flex items-center gap-3">
                  <FruitCard
                    fruitEmoji="🌿"
                    rotation={-3}
                    cycle={1}
                    className="w-20"
                  >
                    <div className="h-12 flex items-center justify-center text-3xl">
                      🍀
                    </div>
                  </FruitCard>
                  <TapeStrip
                    color="green"
                    width={60}
                    angle={0}
                    className="relative"
                  />
                </div>
                <div className="space-y-1">
                  <p
                    className="font-caveat text-xl"
                    style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
                  >
                    no albums yet 🌿
                  </p>
                  <p className="text-sm text-muted-foreground font-body max-w-xs">
                    create a shared wall where your group can pin memories
                    together 🌸
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="albums.scrapbooks_empty_create_button"
                  onClick={() => setModalOpen(true)}
                  className="jumi-btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  create first scrapbook
                </button>
              </div>
            )}

            {/* Divider between sections */}
            <ImageDivider variant="cones" className="my-2" />
          </TabsContent>

          {/* ── Albums Tab ── */}
          <TabsContent value="albums" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-body">
                {albumLoading
                  ? "loading…"
                  : `${albums?.length ?? 0} album${(albums?.length ?? 0) !== 1 ? "s" : ""}`}
              </p>
              <button
                type="button"
                data-ocid="albums.new_album_button"
                onClick={() => setAlbumModalOpen(true)}
                className="jumi-btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4"
              >
                <Plus className="w-3.5 h-3.5" />
                new album
              </button>
            </div>

            {albumLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["al-a", "al-b", "al-c", "al-d"].map((k) => (
                  <Skeleton key={k} className="h-32 rounded-[20px]" />
                ))}
              </div>
            ) : albums && albums.length > 0 ? (
              <div
                data-ocid="albums.albums_list"
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {albums.map((album, i) => (
                  <AlbumFruitCard key={album.id} album={album} index={i} />
                ))}
              </div>
            ) : (
              <div
                data-ocid="albums.albums_empty_state"
                className="flex flex-col items-center justify-center py-12 gap-5 text-center"
              >
                <FruitCard
                  fruitEmoji="📬"
                  rotation={3}
                  cycle={3}
                  className="w-24"
                >
                  <div className="h-14 flex items-center justify-center text-4xl">
                    📬
                  </div>
                </FruitCard>
                <div className="space-y-1">
                  <p
                    className="font-caveat text-xl"
                    style={{ fontFamily: "Caveat, cursive", color: "#3D2C1E" }}
                  >
                    no albums yet 🌿
                  </p>
                  <p className="text-sm text-muted-foreground font-body max-w-xs">
                    start a pass-around album that travels through your friend
                    group 🍓
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="albums.albums_empty_create_button"
                  onClick={() => setAlbumModalOpen(true)}
                  className="jumi-btn-primary flex items-center gap-2"
                >
                  <BookImage className="w-4 h-4" />
                  start an album
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateScrapbookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <CreateAlbumModal
        open={albumModalOpen}
        onClose={() => setAlbumModalOpen(false)}
      />
    </Layout>
  );
}
