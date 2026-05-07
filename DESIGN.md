# VibeMail Juminocore Design System

## Tone & Purpose
Japanese retro stationery aesthetic merged with Y2K nostalgic unboxing. Maximalist, kawaii, intimate photo-sharing experience. Tactile interactions, playful charm elements, digital scrapbook mood. Visual luxury through soft textures, warm pastels, and hand-drawn details.

## Differentiation
Collectible aesthetic: holographic shimmer + gingham patterns + frosted finishes + clovers with ladybugs + strawberry/goldfish fruit motifs + Sanrio-adjacent charm physics. Unboxing-focused delivery with customizable envelopes, wax seals, polaroid frames, and draggable phone charms. No minimalism, no dark UI—only cozy, nostalgic warmth.

## Color Palette

| Token | OKLCH | Usage |
|-------|-------|-------|
| **Background** | 0.96 0.02 90 | Warm cream stationery base |
| **Foreground** | 0.18 0.08 20 | Text, strong contrast, warm brown |
| **Card** | 0.99 0.01 60 | Scrapbook card surfaces |
| **Primary** | 0.55 0.18 28 | Soft cherry-red, main CTA |
| **Secondary** | 0.72 0.14 145 | Mint green, fresh accents |
| **Accent** | 0.64 0.2 355 | Hot pink highlights |
| **Apple Green** | 0.65 0.16 145 | Clover field, nature motif |
| **Butter Yellow** | 0.78 0.12 95 | Warm accent, stickers |
| **Soft Pink** | 0.72 0.12 355 | Gentle blush tones |
| **Cherry Red** | 0.55 0.22 20 | Strawberry motifs, emphasis |

**Dark Mode:** Deep charcoal (0.15–0.22 L) with elevated chroma on fruit colors for visibility.

## Typography

| Layer | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| **Display** | Figtree | 28–48px | 700 | Titles, section headers |
| **Body** | DM Sans | 14–16px | 400 | Copy, UI labels |
| **Mono** | JetBrains Mono | 12–14px | 400 | Tags, metadata |
| **Handwritten** | Caveat | 14–18px | 400 | Intimate labels, doodles |

Lowercase titles preferred. Handwritten font for personal touch on card labels and charm tags.

## Elevation & Depth
- **shadow-soft**: 0 2px 8px, delicate card lift
- **shadow-lifted**: 0 4px 16px, interactive elements
- **shadow-subtle**: 0 1px 3px, minimal accent
- **sticker-shadow**: Composite for photo/charm layering

No harsh borders—soft 1–2px dividers. Holographic shimmer on premium surfaces. Gingham patterns (16px cells @ 0.08 opacity) for scrapbook walls.

## Structural Zones

| Zone | Treatment | Key Classes |
|------|-----------|------|
| **Inbox** | Warm cream bg, gingham wall pattern, card grid | `bg-background gingham-cozy` |
| **Compose** | Stacked content cards, paper texture, stamp accents | `sticker-card texture-grain` |
| **Unboxing** | Centered focal point (locket/soda/clover), soft shadows | `shadow-lifted rounded-generous` |
| **Profile** | Charm cluster center, badge grid, polaroid frames | `rounded-cozy sticker-card` |
| **Dividers** | Real asset images (milkshake lace, ice cream, floats) | Full-width, 60–80px height |

## Spacing & Rhythm
Mobile-first 4–24px grid. Card padding 16px. Gingham cells 16px. Charm spacing 8–12px. Visual hierarchy through scale, not crowding. Generous negative space.

## Component Patterns
- **Fruit Label Cards**: Pastel rounded containers, small preview, sender name, micro-icon
- **Polaroid Frames**: White border, slight rotation (2–5°), shadow-lifted
- **Sticker Cards**: 2px border (primary/0.2), hover state (accent/0.4), rounded-cozy
- **Charms**: Draggable physics, wobble animation, blend-mode multiply for white bg
- **Dividers**: Real photo assets, no tiling, 100% width

## Motion & Animation
- **shimmer**: 4s holographic loop (premium surfaces)
- **float-gentle**: 3s vertical bob + micro-rotate (decorative elements)
- **float-bob**: 3s physics-based float (charm elements)
- **hunt-pulse**: 2s expanding ring pulse (discovery moments)
- **pulse-gentle**: 2s subtle opacity pulse (hints)
- **bounce-soft**: 1.5s gentle vertical bounce (emphasis)
- **wobble-gentle**: 2s micro-rotation (charm playfulness)
- **transition-smooth**: 0.3s cubic-bezier all interactive states

## Rounded Corner System
- **12px (compact)**: Small buttons, sticker controls
- **16px (cozy)**: Default cards, containers
- **20px (generous)**: Large panels, focal elements
- **24px (abundant)**: Extra-large sections, full-width backgrounds

## Rotation for Tactile Feel
- **2° (subtle)**: Minimal visual tilt
- **3° (mild)**: Standard card rotation
- **5° (playful)**: Emphasized, haphazard stacking
Always apply both positive and negative variants (-2°, -3°, -5°) for natural scatter.

## Constraints
- No neon, no dark glass, no harsh shadows
- Min border-radius 12px (soft edges everywhere)
- Vibrant pastels + fruit accents, never clashing
- Text: warm brown on cream (light); cream on deep charcoal (dark)
- Blend modes (multiply) for JPEG stickers with white backgrounds

## Signature Details
**Holographic Shimmer** + **Gingham Patterns** + **Caveat Handwritten Labels** + **Charm Dangle Physics** + **Real Asset Dividers** = Y2K Japanese kawaii stationery nostalgia meets tactile, collectible interaction design. Every surface feels handmade, warm, and intimate.
