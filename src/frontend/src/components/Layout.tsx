import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@tanstack/react-router";
import { BookImage, Heart, Home, PenLine, Send, User } from "lucide-react";
import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useMyStrap } from "../hooks/use-backend";
import { CHARM_PRESETS, CharmType } from "../types";
import type { Charm } from "../types";

const DESKTOP_NAV = [
  { to: "/", icon: Home, label: "Home", ocid: "nav.home" },
  { to: "/compose", icon: PenLine, label: "Compose", ocid: "nav.compose" },
  { to: "/inbox", icon: Heart, label: "Inbox", ocid: "nav.inbox" },
  { to: "/sent", icon: Send, label: "Sent", ocid: "nav.sent" },
  { to: "/albums", icon: BookImage, label: "Albums", ocid: "nav.albums" },
  { to: "/profile", icon: User, label: "Profile", ocid: "nav.profile" },
];

const MOBILE_NAV = [
  { to: "/inbox", icon: Heart, label: "Inbox", ocid: "nav.mobile.inbox" },
  {
    to: "/compose",
    icon: PenLine,
    label: "Compose",
    ocid: "nav.mobile.compose",
  },
  {
    to: "/albums",
    icon: BookImage,
    label: "Albums",
    ocid: "nav.mobile.albums",
  },
  { to: "/profile", icon: User, label: "Profile", ocid: "nav.mobile.profile" },
];

const EMOJI_MAP: Record<string, string> = {
  strawberry: "🍓",
  clover: "🍀",
  ladybug: "🐞",
  apple: "🍎",
  goldfish: "🐟",
  heart: "💗",
  star: "⭐",
  "critter-blob": "🫧",
  flower: "🌸",
  candy: "🍬",
};

const DEFAULT_CHARMS: Charm[] = [
  {
    id: "d1",
    charmType: CharmType.preset,
    presetId: "heart",
    labelText: "Heart",
    position: 0n,
  },
  {
    id: "d2",
    charmType: CharmType.preset,
    presetId: "strawberry",
    labelText: "Strawberry",
    position: 1n,
  },
  {
    id: "d3",
    charmType: CharmType.preset,
    presetId: "clover",
    labelText: "Clover",
    position: 2n,
  },
  {
    id: "d4",
    charmType: CharmType.preset,
    presetId: "star",
    labelText: "Star",
    position: 3n,
  },
];

const MAX_VISIBLE = 5;

function DanglingCharm({ charm, index }: { charm: Charm; index: number }) {
  const [tapped, setTapped] = useState(false);
  const preset = CHARM_PRESETS.find((p) => p.id === charm.presetId);
  const emoji =
    charm.charmType === CharmType.preset
      ? (EMOJI_MAP[charm.presetId] ?? "💗")
      : "📷";
  const isStrawberry = [
    "strawberry",
    "apple",
    "heart",
    "candy",
    "ladybug",
  ].includes(charm.presetId);

  // Spring for dangling: initial swing on mount
  const rawAngle = useSpring(-(8 + index * 3), {
    stiffness: 60,
    damping: 8,
    mass: 0.8,
  });
  const rotate = useTransform(rawAngle, (v) => `${v}deg`);

  useEffect(() => {
    // Animate from offset to zero — spring will overshoot naturally
    const t = setTimeout(() => rawAngle.set(0), 120 + index * 80);
    return () => clearTimeout(t);
  }, [rawAngle, index]);

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);
    rawAngle.set(-22);
    setTimeout(() => {
      rawAngle.set(0);
      setTapped(false);
    }, 600);
  };

  const BEAD_COUNT = 3 + (index % 2);
  const CHAIN_H = 10 + index * 6;

  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer"
      style={{ rotate, transformOrigin: "top center" }}
      whileHover={{ scale: 1.12 }}
      onTap={handleTap}
      title={preset?.labelText ?? charm.labelText}
    >
      {/* Bead chain segment */}
      <svg
        width="6"
        height={CHAIN_H}
        className="overflow-visible"
        role="presentation"
        aria-hidden="true"
      >
        <line
          x1="3"
          y1="0"
          x2="3"
          y2={CHAIN_H}
          stroke="oklch(0.78 0.08 85)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        {Array.from({ length: BEAD_COUNT }, (_, bi) => (
          <circle
            key={`bead-${charm.id}-${bi}`}
            cx="3"
            cy={(bi + 1) * (CHAIN_H / (BEAD_COUNT + 1))}
            r="1.8"
            fill={isStrawberry ? "oklch(0.73 0.18 15)" : "oklch(0.68 0.12 145)"}
            opacity="0.85"
          />
        ))}
      </svg>
      {/* Charm circle */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 charm-shadow",
          isStrawberry
            ? "bg-card border-[oklch(0.56_0.24_15/0.6)]"
            : "bg-card border-[oklch(0.68_0.12_145/0.6)]",
        )}
        style={{ boxShadow: "0 3px 10px var(--charm-shadow)" }}
      >
        {emoji}
      </div>
    </motion.div>
  );
}

function PhoneStrap() {
  const { data: strap } = useMyStrap();
  const charms = strap?.charms?.length ? strap.charms : DEFAULT_CHARMS;
  const visible = charms.slice(0, MAX_VISIBLE);
  const extra = charms.length - MAX_VISIBLE;
  const strapRef = useRef<HTMLDivElement>(null);

  // Whole-strap idle sway
  const swayAngle = useSpring(0, { stiffness: 20, damping: 6 });
  const strapRotate = useTransform(swayAngle, (v) => `${v}deg`);

  useEffect(() => {
    let dir = 1;
    const interval = setInterval(() => {
      swayAngle.set(dir * 2);
      dir *= -1;
    }, 2800);
    return () => clearInterval(interval);
  }, [swayAngle]);

  // Total chain height for SVG
  const STRAP_W = 6;
  const TOP_CONNECTOR_H = 28;
  const CHARM_SPACING = 48;
  const totalH = TOP_CONNECTOR_H + visible.length * CHARM_SPACING + 20;

  return (
    <div
      ref={strapRef}
      className="fixed right-3 top-10 z-30 flex flex-col items-center pointer-events-auto select-none"
      data-ocid="strap.widget"
      aria-label="Phone strap decoration"
    >
      <motion.div
        style={{ rotate: strapRotate, transformOrigin: "top center" }}
        className="flex flex-col items-center"
      >
        {/* Top attachment loop */}
        <svg
          width={STRAP_W * 4}
          height={TOP_CONNECTOR_H}
          className="overflow-visible"
          role="presentation"
          aria-hidden="true"
        >
          {/* Gold connector line */}
          <line
            x1="12"
            y1="0"
            x2="12"
            y2={TOP_CONNECTOR_H}
            stroke="oklch(0.78 0.12 85)"
            strokeWidth="2"
          />
          {/* Small top loop oval */}
          <ellipse
            cx="12"
            cy="4"
            rx="4"
            ry="3"
            fill="none"
            stroke="oklch(0.72 0.1 85)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Gold vertical chain */}
        <svg
          width={STRAP_W * 4}
          height={totalH}
          className="overflow-visible"
          role="presentation"
          aria-hidden="true"
        >
          <line
            x1="12"
            y1="0"
            x2="12"
            y2={totalH}
            stroke="oklch(0.78 0.12 85)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          {/* Gold beads along main chain */}
          {Array.from({ length: Math.floor(totalH / 8) }, (_, i) => (
            <circle
              key={`chain-${i}-${totalH}`}
              cx="12"
              cy={4 + i * 8}
              r="1.5"
              fill="oklch(0.82 0.1 80)"
              opacity="0.7"
            />
          ))}
        </svg>

        {/* Charms positioned along chain */}
        <div
          className="absolute top-12 left-0 right-0 flex flex-col items-center gap-0"
          style={{ top: TOP_CONNECTOR_H + 4 }}
        >
          {visible.map((charm, i) => (
            <DanglingCharm key={charm.id} charm={charm} index={i} />
          ))}
          {extra > 0 && (
            <div className="mt-1 w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center">
              <span className="text-[8px] font-body text-muted-foreground font-bold">
                +{extra}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  hideNav?: boolean;
}

export function Layout({ children, className, hideNav = false }: LayoutProps) {
  const { isAuthenticated, login, logout, isLoading } = useAuth();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{ background: "#FFF6E9" }}
    >
      {/* Paper grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'url(\'data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /></filter><rect width="100" height="100" fill="oklch(0.35 0.06 60)" filter="url(%23noise)" opacity="0.8"/></svg>\')',
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      {/* Top nav bar — cream with warm brown text */}
      <header
        className="sticky top-0 z-40 border-b shadow-stickerSubtle"
        style={{ background: "#FFF6E9", borderColor: "#EADBC8" }}
      >
        <div className="relative max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 group"
            data-ocid="nav.logo_link"
          >
            <span className="text-2xl">💌</span>
            <span
              className="font-display font-bold text-xl tracking-tight lowercase transition-colors duration-200"
              style={{ color: "#A8D672" }}
            >
              vibemail
            </span>
            <span
              className="text-[11px] font-caveat hidden sm:block"
              style={{ color: "#7A5C4A", fontFamily: "Caveat, cursive" }}
            >
              ✨ y2k letters
            </span>
          </Link>

          {/* Desktop nav */}
          {!hideNav && (
            <nav className="hidden md:flex items-center gap-1">
              {DESKTOP_NAV.map(({ to, icon: Icon, label, ocid }) => (
                <Link
                  key={to}
                  to={to}
                  data-ocid={ocid}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium transition-smooth"
                  style={{
                    background: currentPath === to ? "#A8D672" : "transparent",
                    color: currentPath === to ? "#FFF6E9" : "#7A5C4A",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-20 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-ocid="nav.logout_button"
                className="rounded-full text-xs"
                style={{ color: "#7A5C4A" }}
              >
                Sign out
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => login()}
                data-ocid="nav.login_button"
                className="jumi-btn-primary text-xs px-4 py-1.5 rounded-full"
                style={{ background: "#E85A5A", borderRadius: "9999px" }}
              >
                ✨ Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Phone strap — fixed on right side */}
      <PhoneStrap />

      {/* Main content */}
      <main
        className={cn(
          "relative z-10 flex-1 max-w-screen-lg mx-auto w-full px-4 py-6",
          className,
        )}
      >
        {children}
      </main>

      {/* Mobile bottom nav — soft pink bg */}
      {!hideNav && isAuthenticated && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
          style={{ background: "#F7C6C7", borderColor: "#EADBC8" }}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {MOBILE_NAV.map(({ to, icon: Icon, label, ocid }) => (
              <Link
                key={to}
                to={to}
                data-ocid={ocid}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-smooth min-w-0"
                style={{
                  color: currentPath === to ? "#A8D672" : "#7A5C4A",
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-body font-medium truncate">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Footer — beige bg */}
      <footer
        className="border-t py-4 px-4 text-center pb-safe relative z-10"
        style={{ background: "#EADBC8", borderColor: "#d4c5b0" }}
      >
        <p className="text-xs font-body" style={{ color: "#3D2C1E" }}>
          © {new Date().getFullYear()} VibeMail 💌{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            className="underline underline-offset-2 hover:opacity-80 transition-opacity duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
