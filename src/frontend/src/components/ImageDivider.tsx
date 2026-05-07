import { cn } from "@/lib/utils";

type DividerVariant = "milkshake" | "cones" | "floats";

const DIVIDER_SRC: Record<DividerVariant, string> = {
  milkshake: "/assets/dividers/divider-milkshake.png",
  cones: "/assets/dividers/divider-cones.png",
  floats: "/assets/dividers/divider-floats.png",
};

const DEFAULT_HEIGHT: Record<DividerVariant, number> = {
  milkshake: 64,
  cones: 48,
  floats: 48,
};

interface ImageDividerProps {
  variant: DividerVariant;
  className?: string;
  height?: number;
}

export function ImageDivider({
  variant,
  className,
  height,
}: ImageDividerProps) {
  const h = height ?? DEFAULT_HEIGHT[variant];
  return (
    <img
      src={DIVIDER_SRC[variant]}
      alt=""
      aria-hidden="true"
      className={cn(
        "w-full object-cover object-center pointer-events-none select-none",
        className,
      )}
      style={{
        height: `${h}px`,
        mixBlendMode: "multiply",
        display: "block",
      }}
    />
  );
}
