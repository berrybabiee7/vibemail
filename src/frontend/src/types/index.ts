import {
  CharmType,
  EnvelopeTexture,
  MusicLoop,
  UnboxingType,
} from "../backend";

export { CharmType, EnvelopeTexture, MusicLoop, UnboxingType };

export type {
  Album,
  AlbumEntry,
  AlbumId,
  Charm,
  CreateLetterInput,
  Letter,
  LetterId,
  PhoneStrap,
  Photo,
  Scrapbook,
  ScrapbookId,
  ScrapbookPost,
  UserProfile,
} from "../backend";
export type { Principal } from "@icp-sdk/core/principal";

export interface PhotoFrameOption {
  id: string;
  label: string;
  src: string;
  /** How to render: 'polaroid' | 'overlay' */
  mode: "polaroid" | "overlay";
  /** Tailwind/inline note for display in picker */
  description: string;
}

export const PHOTO_FRAME_OPTIONS: PhotoFrameOption[] = [
  {
    id: "polaroid-white",
    label: "Polaroid",
    src: "/assets/frames/polaroid-white.png",
    mode: "polaroid",
    description: "Classic white polaroid frame",
  },
  {
    id: "frame-scalloped-green",
    label: "Scalloped",
    src: "/assets/frames/frame-scalloped-green.png",
    mode: "overlay",
    description: "Sage green wavy Y2K border",
  },
  {
    id: "camera-instax",
    label: "Instax",
    src: "/assets/frames/camera-instax.png",
    mode: "overlay",
    description: "Silver Instax camera front",
  },
  {
    id: "camera-sony",
    label: "Sony Cam",
    src: "/assets/frames/camera-sony.png",
    mode: "overlay",
    description: "Sony camera back panel",
  },
];

export interface CharmPreset {
  id: string;
  emoji: string;
  labelText: string;
  category: "fruit" | "nature" | "critter" | "sparkle" | "sweet" | "digital";
  imagePath?: string;
}

export const CHARM_PRESETS: CharmPreset[] = [
  { id: "strawberry", emoji: "🍓", labelText: "Strawberry", category: "fruit" },
  { id: "clover", emoji: "🍀", labelText: "Clover", category: "nature" },
  { id: "ladybug", emoji: "🐞", labelText: "Ladybug", category: "critter" },
  { id: "apple", emoji: "🍎", labelText: "Apple", category: "fruit" },
  { id: "goldfish", emoji: "🐠", labelText: "Goldfish", category: "critter" },
  { id: "heart", emoji: "💗", labelText: "Heart", category: "sparkle" },
  { id: "star", emoji: "⭐", labelText: "Star", category: "sparkle" },
  {
    id: "critter-blob",
    emoji: "🫧",
    labelText: "Critter Blob",
    category: "critter",
  },
  { id: "flower", emoji: "🌸", labelText: "Flower", category: "nature" },
  { id: "candy", emoji: "🍬", labelText: "Candy", category: "sweet" },
];

// Digital charm imagePaths map to the actual files saved in /assets/charms/
// (files were saved under these names during a prior build session)
export const DIGITAL_CHARM_PRESETS: CharmPreset[] = [
  {
    id: "chiikawa",
    emoji: "🐹",
    labelText: "Chiikawa",
    category: "digital",
    imagePath: "/assets/charms/chiikawa.png",
  },
  {
    id: "pompompurin",
    emoji: "🍮",
    labelText: "Pompompurin",
    category: "digital",
    imagePath: "/assets/charms/pompompurin.png",
  },
  {
    id: "enamel-star",
    emoji: "⭐",
    labelText: "Enamel Star",
    category: "digital",
    imagePath: "/assets/charms/enamel-star.png",
  },
  {
    id: "apple-locket-red",
    emoji: "🍎",
    labelText: "Red Apple Locket",
    category: "digital",
    imagePath: "/assets/charms/apple-locket-red.png",
  },
  {
    id: "apple-locket-green",
    emoji: "🍏",
    labelText: "Green Apple Locket",
    category: "digital",
    imagePath: "/assets/charms/apple-locket-green.png",
  },
];

export const UNBOXING_LABELS: Record<UnboxingType, string> = {
  [UnboxingType.polaroidStack]: "📸 Polaroid Stack",
  [UnboxingType.secretLocket]: "💗 Secret Locket",
  [UnboxingType.cdStickerPeeler]: "💿 CD Sticker Peeler",
  [UnboxingType.fruitSoda]: "🍹 Fruit Soda",
  [UnboxingType.openWhen]: "✉️ Open When…",
  [UnboxingType.musicBox]: "🎵 Music Box",
  [UnboxingType.strawberryJar]: "🫙 Strawberry Jar",
  [UnboxingType.cloverField]: "🍀 Clover Field",
};
