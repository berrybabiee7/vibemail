import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { EnvelopeTexture, type Letter } from "../types";
import { UNBOXING_LABELS } from "../types";

interface EnvelopeCardProps {
  letter: Letter;
  onClick?: () => void;
  className?: string;
  isInbox?: boolean;
}

// Deterministic per-card rotation (2–5 degrees, alternating sign)
function getRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const mag = 2 + (Math.abs(h) % 4);
  return h % 2 === 0 ? mag : -mag;
}

// Deterministic background variant
const TILE_VARIANTS = [
  { bg: "#FFF6E9", border: "#EADBC8", accent: "#F6E27F", icon: "🍋" }, // fruit
  { bg: "#EAF5E3", border: "#A8D672", accent: "#A8D672", icon: "🍀" }, // parcel
  { bg: "#FFF0F0", border: "#F7C6C7", accent: "#E85A5A", icon: "🍒" }, // cup
  { bg: "#FFF6E9", border: "#F7C6C7", accent: "#F7C6C7", icon: "⭐" }, // stamp
];

const SEALS = ["/assets/seals/seal-bow.png", "/assets/seals/seal-cloud.png"];

const TINY_ICONS = ["🍀", "🐞", "⭐", "🌸", "🍓"];

function pickByHash(arr: string[], key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return arr[Math.abs(hash) % arr.length];
}

export function EnvelopeCard({
  letter,
  onClick,
  className,
  isInbox = false,
}: EnvelopeCardProps) {
  const createdAt = Number(letter.createdAt) / 1_000_000;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const seal = pickByHash(SEALS, `${letter.id}seal`);

  // Deterministic variant + rotation
  let idHash = 0;
  for (let i = 0; i < letter.id.length; i++)
    idHash = (idHash * 31 + letter.id.charCodeAt(i)) | 0;
  const variant = TILE_VARIANTS[Math.abs(idHash) % TILE_VARIANTS.length];
  const rotation = getRotation(letter.id);
  const tinyIcon = TINY_ICONS[Math.abs(idHash) % TINY_ICONS.length];

  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid="envelope_card.button"
      className={cn(
        "relative w-full text-left overflow-hidden border-2",
        "transition-all duration-200 group",
        "hover:-translate-y-1 active:scale-[0.98]",
        className,
      )}
      style={{
        background: variant.bg,
        borderColor: variant.border,
        borderRadius: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12)",
        transform: `rotate(${rotation}deg)`,
        padding: "1rem",
      }}
    >
      {/* Subtle gingham tint for gingham texture */}
      {letter.envelopeTexture === EnvelopeTexture.gingham && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(45deg, rgba(168,214,114,0.15) 25%, transparent 25%, transparent 75%, rgba(168,214,114,0.15) 75%), linear-gradient(45deg, rgba(168,214,114,0.15) 25%, transparent 25%, transparent 75%, rgba(168,214,114,0.15) 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 8px 8px",
          }}
          aria-hidden="true"
        />
      )}

      {/* Envelope texture ghost */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <img
          src="/assets/envelopes/envelope-sealed.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.06] mix-blend-multiply"
          draggable={false}
        />
      </div>

      {/* Wax seal — bottom right */}
      <img
        src={seal}
        alt="Wax seal"
        aria-hidden="true"
        className="absolute bottom-2 right-12 w-8 h-8 object-contain pointer-events-none select-none opacity-90"
        style={{ transform: "rotate(-6deg)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-2">
        {/* Header: tiny icon + sender/time */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base flex-shrink-0" aria-hidden="true">
              {tinyIcon}
            </span>
            <div className="min-w-0">
              <p
                className="text-xs truncate"
                style={{
                  fontFamily: "Caveat, cursive",
                  color: "#3D2C1E",
                  fontSize: "13px",
                }}
              >
                {isInbox ? "from a friend" : "to a friend"}
              </p>
              <p className="text-[11px]" style={{ color: "#7A5C4A" }}>
                {timeAgo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mr-11">
            {!letter.isRead && isInbox && (
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#E85A5A" }}
              />
            )}
            {letter.musicLoop && (
              <span className="text-sm" title="Has music">
                🎵
              </span>
            )}
            {letter.openWhenTime && (
              <span className="text-sm" title="Time-locked">
                ⏰
              </span>
            )}
          </div>
        </div>

        {/* Note preview */}
        <p
          className="text-sm font-body line-clamp-2 leading-relaxed"
          style={{ color: "#3D2C1E" }}
        >
          {letter.note}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge
            variant="secondary"
            className="text-[10px] font-body rounded-full px-2 py-0.5"
            style={{
              background: `${variant.accent}55`,
              color: "#3D2C1E",
              border: `1px solid ${variant.border}`,
            }}
          >
            {UNBOXING_LABELS[letter.unboxingType]}
          </Badge>
          <span className="text-xs font-body" style={{ color: "#7A5C4A" }}>
            {letter.photos.length} 📷
          </span>
        </div>
      </div>

      {/* Hover shimmer overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${variant.accent}15 0%, transparent 70%)`,
          borderRadius: "20px",
        }}
      />
    </button>
  );
}
