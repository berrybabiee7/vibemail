import {
  PolaroidFrame,
  StampCard,
  TapeStrip,
} from "@/components/JumiComponents";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/use-auth";

const FEATURE_TILES = [
  { emoji: "📷", label: "Polaroid Stacks", rot: -4 },
  { emoji: "🔒", label: "Secret Lockets", rot: 3 },
  { emoji: "💿", label: "CD Peelers", rot: -2 },
  { emoji: "🧃", label: "Soda Float", rot: 5 },
  { emoji: "🎵", label: "Music Box", rot: -3 },
  { emoji: "🍀", label: "Clover Field", rot: 4 },
];

export function HomePage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/inbox" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <Layout>
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-10 py-12 jumi-gingham rounded-3xl relative overflow-visible"
        data-ocid="home.page"
      >
        {/* Tape decorations */}
        <TapeStrip
          color="yellow"
          width={120}
          angle={-5}
          className="top-6 left-8"
        />
        <TapeStrip
          color="pink"
          width={90}
          angle={6}
          className="top-4 right-12"
        />
        <TapeStrip
          color="green"
          width={80}
          angle={-3}
          className="bottom-8 left-16"
        />

        {/* Hero area */}
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* PolaroidFrame with decorative pattern */}
          <motion.div
            animate={{ rotate: [0, -2, 2, 0] }}
            transition={{
              duration: 6,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
          >
            <PolaroidFrame
              caption="vibemail ✉️"
              rotation={-3}
              className="w-40 h-44"
            >
              <div
                className="w-full h-full flex items-center justify-center jumi-gingham"
                style={{ minHeight: "100px" }}
              >
                <motion.span
                  className="text-5xl block"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  ✉️
                </motion.span>
              </div>
            </PolaroidFrame>
          </motion.div>

          {/* Title */}
          <div className="flex flex-col items-center gap-2">
            <h1
              className="font-display font-bold text-[48px] leading-tight lowercase"
              style={{ color: "#A8D672" }}
            >
              vibemail ✉️
            </h1>
            <p
              className="font-body text-[16px] max-w-sm leading-relaxed"
              style={{ color: "#7A5C4A" }}
            >
              y2k-style photo letters for your besties. secret notes, lockets,
              and more 🍓
            </p>
          </div>
        </motion.div>

        {/* Feature StampCard tiles */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {FEATURE_TILES.map((tile, i) => (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
            >
              <StampCard label={tile.label} rotation={tile.rot}>
                <span className="text-2xl px-1 py-0.5">{tile.emoji}</span>
              </StampCard>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          {!isLoading && !isAuthenticated && (
            <button
              type="button"
              onClick={() => login()}
              data-ocid="home.login_button"
              className="jumi-btn-primary text-base px-8 py-3 flex items-center gap-2"
            >
              ✨ sign in with internet identity
            </button>
          )}

          {isLoading && (
            <div
              className="w-64 h-12 rounded-[16px] bg-muted animate-pulse"
              data-ocid="home.loading_state"
            />
          )}
        </motion.div>

        {/* Decorative corner stamps */}
        <div className="absolute bottom-4 right-4">
          <StampCard label="kawaii 🌸" rotation={6}>
            <span className="text-xl px-1">🍓</span>
          </StampCard>
        </div>
        <div className="absolute bottom-4 left-4">
          <StampCard label="y2k ✨" rotation={-5}>
            <span className="text-xl px-1">🍀</span>
          </StampCard>
        </div>
      </div>
    </Layout>
  );
}
