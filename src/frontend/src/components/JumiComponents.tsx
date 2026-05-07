import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

// ── TapeStrip ────────────────────────────────────────────────────────────────
type TapeColor = "yellow" | "pink" | "green";
const TAPE_COLORS: Record<TapeColor, string> = {
  yellow: "rgba(246,226,127,0.65)",
  pink: "rgba(247,198,199,0.70)",
  green: "rgba(168,214,114,0.55)",
};

interface TapeStripProps {
  color?: TapeColor;
  width?: number | string;
  angle?: number;
  className?: string;
}

export function TapeStrip({
  color = "yellow",
  width = 80,
  angle = -5,
  className,
}: TapeStripProps) {
  const bg = TAPE_COLORS[color];
  return (
    <div
      aria-hidden="true"
      className={cn("absolute pointer-events-none", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: "18px",
        background: `linear-gradient(90deg, transparent 0%, ${bg} 12%, ${bg} 88%, transparent 100%)`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "center",
        backdropFilter: "blur(1px)",
        borderTop: "1px solid rgba(255,255,255,0.45)",
        borderBottom: "1px solid rgba(255,255,255,0.35)",
      }}
    />
  );
}

// ── FruitCard ────────────────────────────────────────────────────────────────
const FRUIT_BG_CYCLE = [
  "bg-[#FFF6E9] border-[#EADBC8]",
  "bg-[#EAF5E3] border-[#A8D672]",
  "bg-[#FFF0F0] border-[#F7C6C7]",
  "bg-[#FFFBEC] border-[#F6E27F]",
];

interface FruitCardProps {
  children: React.ReactNode;
  fruitEmoji?: string;
  rotation?: number;
  cycle?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function FruitCard({
  children,
  fruitEmoji = "🍎",
  rotation = 0,
  cycle = 0,
  className,
  style,
  onClick,
}: FruitCardProps) {
  const bgClass = FRUIT_BG_CYCLE[cycle % FRUIT_BG_CYCLE.length];
  return (
    <div
      className={cn(
        "relative p-4 rounded-[20px] border-2 shadow-sticker transition-all duration-200",
        "hover:shadow-stickerLift hover:-translate-y-1",
        bgClass,
        onClick && "cursor-pointer",
        className,
      )}
      style={{ transform: `rotate(${rotation}deg)`, ...style }}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span
        className="absolute -top-3 -right-2 text-xl select-none"
        aria-hidden="true"
      >
        {fruitEmoji}
      </span>
      {children}
    </div>
  );
}

// ── StampCard ────────────────────────────────────────────────────────────────
interface StampCardProps {
  label?: string;
  imageSrc?: string;
  rotation?: number;
  className?: string;
  children?: React.ReactNode;
}

export function StampCard({
  label,
  imageSrc,
  rotation = -2,
  className,
  children,
}: StampCardProps) {
  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center gap-1 p-2",
        "bg-[#FFF6E9] rounded-[8px] border-2 border-[#E85A5A]/40",
        "shadow-stickerSubtle",
        className,
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        // serrated-stamp-like effect via box-shadow outline
        outline: "2px dashed rgba(232,90,90,0.25)",
        outlineOffset: "3px",
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={label ?? "stamp"}
          className="w-12 h-12 object-cover rounded-sm mix-blend-multiply"
        />
      ) : (
        children
      )}
      {label && (
        <span
          className="font-caveat text-[11px] text-[#3D2C1E] leading-none text-center"
          style={{ fontFamily: "Caveat, cursive" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ── PolaroidFrame ────────────────────────────────────────────────────────────
interface PolaroidFrameProps {
  src?: string;
  alt?: string;
  caption?: string;
  rotation?: number;
  className?: string;
  children?: React.ReactNode;
}

export function PolaroidFrame({
  src,
  alt = "",
  caption,
  rotation = -3,
  className,
  children,
}: PolaroidFrameProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-col bg-[#FFF6E9] shadow-sticker",
        "border border-[#EADBC8] p-2 pb-6",
        className,
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        borderRadius: "4px",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ minHeight: "80px" }}
        />
      ) : (
        children
      )}
      {caption && (
        <span
          className="absolute bottom-1.5 left-0 right-0 text-center text-[12px] text-[#3D2C1E] px-1 truncate"
          style={{ fontFamily: "Caveat, cursive" }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}

// ── BadgePin ─────────────────────────────────────────────────────────────────
interface BadgePinProps {
  icon: string;
  title?: string;
  className?: string;
}

export function BadgePin({ icon, title, className }: BadgePinProps) {
  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      title={title}
    >
      {/* Pin dot at top */}
      <div
        className="w-2 h-2 rounded-full bg-[#7A5C4A] shadow-stickerSubtle mb-0.5"
        aria-hidden="true"
      />
      <div className="w-10 h-10 rounded-full bg-[#A8D672] border-2 border-[#FFF6E9] shadow-sticker flex items-center justify-center text-lg">
        {icon}
      </div>
      {title && (
        <span
          className="mt-0.5 text-[10px] text-[#3D2C1E] text-center font-medium leading-tight"
          style={{ fontFamily: "Caveat, cursive" }}
        >
          {title}
        </span>
      )}
    </div>
  );
}

// ── PouchContainer ───────────────────────────────────────────────────────────
interface PouchContainerProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function PouchContainer({
  children,
  title,
  className,
}: PouchContainerProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[#EAF5E3] border-2 border-[#A8D672]/50 shadow-sticker",
        className,
      )}
      style={{ borderRadius: "24px 24px 16px 16px" }}
    >
      {/* Pouch arch top */}
      <div
        className="absolute top-0 left-0 right-0 h-6 bg-[#A8D672]/20"
        style={{ borderRadius: "24px 24px 0 0" }}
        aria-hidden="true"
      />
      {/* Pouch string detail */}
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1"
        aria-hidden="true"
      >
        <div className="w-1 h-3 rounded-full bg-[#7A5C4A]/40" />
        <div className="w-1 h-3 rounded-full bg-[#7A5C4A]/40" />
      </div>
      {title && (
        <div className="relative z-10 text-center pt-8 pb-1">
          <span
            className="text-sm text-[#3D2C1E] font-medium"
            style={{ fontFamily: "Caveat, cursive" }}
          >
            {title}
          </span>
        </div>
      )}
      <div className={cn("relative z-10", title ? "pt-2" : "pt-8")}>
        {children}
      </div>
    </div>
  );
}
