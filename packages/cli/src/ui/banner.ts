/**
 * forgelore CLI banner and branding
 * Anvil + book ASCII art with forge heat-up animation
 *
 * Animation concept: the art starts cold (barely visible), heats up through
 * Sedona red-rock tones to full color, then a burst of sparks erupts at the
 * book-anvil junction. The title forges letter by letter from ember to final.
 */

import boxen from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";
import { colors } from "./theme.js";

// ─── Sedona Brand Palette ────────────────────────────────────

const SEDONA         = "#CC5500"; // deep Sedona red-rock
const SEDONA_GLOW    = "#E07020"; // bright warm Sedona
const SEDONA_SUNSET  = "#F5A050"; // sunset gold
const LORE_VIOLET    = "#7C3AED"; // lore violet
const LORE_CYAN      = "#06B6D4"; // lore cyan
const DARK           = "#2A2A2A"; // cold / unlit
const FLASH_WARM     = "#FFF0D0"; // warm-white impact flash

// Pre-built gradients
const brandGradient = gradient([SEDONA, SEDONA_SUNSET, LORE_VIOLET, LORE_CYAN]);

// Per-character title gradient: Sedona warm → lore cool
const TITLE_COLORS = [
  "#CC5500", // F — deep Sedona
  "#D46020", // O
  "#DC7030", // R
  "#F5A050", // G — Sedona sunset
  "#C09040", // E — transitioning
  "#9060B0", // L — blending
  "#7C3AED", // O — lore violet
  "#4196CB", // R
  "#06B6D4", // E — lore cyan
];

// ─── ASCII Art ───────────────────────────────────────────────

const BOOK_LINES = [
  "         .───────────.",
  "        ╱ ≡ ≡ ≡ ≡ ≡ ╱│",
  "       ╱ ≡ ≡ ≡ ≡ ≡ ╱ │",
  "      ├───────────┤  │",
  "      │ ≡ ≡ ≡ ≡ ≡ │  │",
  "      │ ≡ ≡ ≡ ≡ ≡ │ ╱",
  "      │ ≡ ≡ ≡ ≡ ≡ │╱",
  "      └─────┬─────┘",
];

const ANVIL_LINES = [
  "        ╔═══╧════╗",
  "   ━━━━━╣████████╠━━━━━",
  "        ║████████║",
  "        ╚═══╤════╝",
  "       █████╧██████",
  "      ████████████████",
];

const TOTAL_ART_LINES = BOOK_LINES.length + ANVIL_LINES.length;
const JUNCTION = BOOK_LINES.length - 1; // line where book meets anvil

// Spark characters with warm Sedona color pools
const SPARK_POOL = [
  { char: "✦", bright: ["#F5A050", "#FFD090", "#FFF0D0"] },
  { char: "✧", bright: ["#FFD090", "#FFF0D0"] },
  { char: "✶", bright: ["#E07020", "#F5A050"] },
  { char: "∗", bright: ["#CC5500", "#E07020"] },
  { char: "·", bright: ["#F5A050", "#FFD090"] },
  { char: "˚", bright: ["#CC8800", "#F5A050"] },
];

const EMBER_COLORS = ["#996600", "#805500"];

// ─── ANSI Helpers ────────────────────────────────────────────

const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_LINE  = "\x1b[2K";
const moveUp = (n: number) => (n > 0 ? `\x1b[${n}A` : "");
const sleep  = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Color Math ──────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    c(r).toString(16).padStart(2, "0") +
    c(g).toString(16).padStart(2, "0") +
    c(b).toString(16).padStart(2, "0")
  );
}

function lerpHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

// ─── Art Coloring ────────────────────────────────────────────

/**
 * Color the full art at a given heat level.
 *   heat  — 0 (cold, dark gray) to 1 (full Sedona / lore color)
 *   flash — 0–1, brightens junction lines toward warm-white
 */
function colorArt(heat: number, flash = 0): string[] {
  const t = Math.max(0, Math.min(1, heat));
  const f = Math.max(0, Math.min(1, flash));

  // Book: lore gradient modulated by heat
  const bkS = lerpHex(DARK, LORE_VIOLET, t);
  const bkE = lerpHex(DARK, LORE_CYAN, t);
  // Anvil: forge gradient modulated by heat
  const avS = lerpHex(DARK, SEDONA, t);
  const avE = lerpHex(DARK, SEDONA_SUNSET, t);

  // Junction flash variants
  const fbkS = lerpHex(bkS, FLASH_WARM, f);
  const fbkE = lerpHex(bkE, FLASH_WARM, f);
  const favS = lerpHex(avS, FLASH_WARM, f);
  const favE = lerpHex(avE, FLASH_WARM, f);

  const bookColored = BOOK_LINES.map((line, i) => {
    if (f > 0 && i >= BOOK_LINES.length - 2) {
      return gradient([fbkS, fbkE])(line);
    }
    return gradient([bkS, bkE])(line);
  });

  const anvilColored = ANVIL_LINES.map((line, i) => {
    if (f > 0 && i < 2) {
      return gradient([favS, favE])(line);
    }
    return gradient([avS, avE])(line);
  });

  return [...bookColored, ...anvilColored];
}

// ─── Sparks ──────────────────────────────────────────────────

function randomSpark(bright = true): string {
  const s = SPARK_POOL[Math.floor(Math.random() * SPARK_POOL.length)];
  const pool = bright ? s.bright : EMBER_COLORS;
  return chalk.hex(pool[Math.floor(Math.random() * pool.length)])(s.char);
}

/**
 * Generate spark decorations for each art line at a burst frame.
 *   0 = tight burst, 1–2 = expanding, 3 = last embers, 4+ = clear
 */
function sparkOverlay(frame: number): Map<number, string> {
  const sp = new Map<number, string>();
  const j = JUNCTION;

  if (frame === 0) {
    sp.set(j - 1, "  " + randomSpark() + randomSpark());
    sp.set(j,     "   " + randomSpark() + " " + randomSpark() + randomSpark());
    sp.set(j + 1, "  " + randomSpark() + randomSpark());
    sp.set(j + 2, " " + randomSpark());
  } else if (frame === 1) {
    sp.set(j - 3, "      " + randomSpark());
    sp.set(j - 2, "    " + randomSpark() + " " + randomSpark());
    sp.set(j - 1, "   " + randomSpark() + "  " + randomSpark());
    sp.set(j,     "  " + randomSpark() + "   " + randomSpark());
    sp.set(j + 1, "   " + randomSpark() + " " + randomSpark());
    sp.set(j + 2, "    " + randomSpark());
    sp.set(j + 3, "      " + randomSpark());
  } else if (frame === 2) {
    sp.set(j - 4, "        " + randomSpark(false));
    sp.set(j - 2, "      " + randomSpark());
    sp.set(j,     "    " + randomSpark(false) + "  " + randomSpark());
    sp.set(j + 2, "      " + randomSpark(false));
    sp.set(j + 4, "        " + randomSpark(false));
  } else if (frame === 3) {
    sp.set(j - 3, "         " + randomSpark(false));
    sp.set(j + 1, "     " + randomSpark(false));
  }
  return sp;
}

// ─── Frame Output ────────────────────────────────────────────

function writeFrame(lines: string[], sparks: Map<number, string>): void {
  for (let i = 0; i < lines.length; i++) {
    process.stdout.write(CLEAR_LINE + lines[i] + (sparks.get(i) || "") + "\n");
  }
}

// ─── Title ───────────────────────────────────────────────────

function getTitle(): string {
  return "FORGELORE"
    .split("")
    .map((ch, i) => chalk.bold(chalk.hex(TITLE_COLORS[i])(ch)))
    .join("");
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Static banner — used in non-TTY or when animation is skipped
 */
export function renderBanner(): string {
  const art = colorArt(1).join("\n");
  const title = `  ${getTitle()}`;
  const tagline = colors.muted("  forge knowledge, shape code");
  const version = chalk.dim("  v0.1.0");
  return `\n${art}\n\n${title}\n${tagline}${version}\n`;
}

/**
 * Animated banner — forge heat-up, impact sparks, title forging
 *
 * Timeline (~1.6s):
 *   Cold reveal    280ms  (14 lines × 20ms)
 *   Heat-up        330ms  (6 steps × 55ms)
 *   Impact burst   325ms  (5 frames × 65ms)
 *   Title forge    495ms  (9 letters × 55ms)
 *   Tagline        120ms  (pause + print)
 */
export async function renderAnimatedBanner(): Promise<void> {
  if (!process.stdout.isTTY) {
    console.log(renderBanner());
    return;
  }

  process.stdout.write(HIDE_CURSOR);

  try {
    console.log(""); // top padding

    // ── Phase 1: Cold reveal ──────────────────────────────────
    // Lines appear barely visible, like cooling metal in the dark
    const coldArt = colorArt(0.08);
    for (const line of coldArt) {
      process.stdout.write(CLEAR_LINE + line + "\n");
      await sleep(20);
    }

    // ── Phase 2: Heat-up ──────────────────────────────────────
    // Art warms from dark to full Sedona / lore color
    const heatSteps = [0.15, 0.30, 0.50, 0.70, 0.85, 1.0];
    for (const heat of heatSteps) {
      process.stdout.write(moveUp(TOTAL_ART_LINES));
      const frame = colorArt(heat);
      for (const line of frame) {
        process.stdout.write(CLEAR_LINE + line + "\n");
      }
      await sleep(55);
    }

    // ── Phase 3: Impact flash + spark burst ───────────────────
    // Junction flashes white-hot, sparks erupt outward
    process.stdout.write(moveUp(TOTAL_ART_LINES));
    writeFrame(colorArt(1.0, 0.6), sparkOverlay(0));
    await sleep(65);

    // Burst frames with decaying flash
    for (let f = 1; f <= 4; f++) {
      const flashDecay = Math.max(0, 0.45 - f * 0.15);
      process.stdout.write(moveUp(TOTAL_ART_LINES));
      writeFrame(colorArt(1.0, flashDecay), sparkOverlay(f));
      await sleep(65);
    }

    // Clean final art
    process.stdout.write(moveUp(TOTAL_ART_LINES));
    writeFrame(colorArt(1.0), new Map());

    // ── Phase 4: Title forging ────────────────────────────────
    // Each letter: ember block → cooling metal → final color
    console.log("");
    process.stdout.write("  ");
    const title = "FORGELORE";
    for (let i = 0; i < title.length; i++) {
      process.stdout.write(chalk.hex(SEDONA_GLOW)("█"));
      await sleep(15);
      process.stdout.write("\b" + chalk.hex("#CC7744")("▓"));
      await sleep(15);
      process.stdout.write(
        "\b" + chalk.bold(chalk.hex(TITLE_COLORS[i])(title[i]))
      );
      await sleep(25);
    }
    console.log("");

    // ── Phase 5: Tagline ──────────────────────────────────────
    await sleep(120);
    console.log(
      colors.muted("  forge knowledge, shape code") + chalk.dim("  v0.1.0")
    );
    console.log("");
  } finally {
    process.stdout.write(SHOW_CURSOR);
  }
}

/**
 * Render a boxed section with Sedona-themed border
 */
export function renderBox(
  content: string,
  title?: string,
  borderColor = SEDONA
): string {
  return boxen(content, {
    padding: 1,
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderStyle: "round",
    borderColor,
    title,
    titleAlignment: "left",
  });
}

/**
 * Render a titled section with brand gradient
 */
export function renderSection(title: string, content: string): string {
  return `\n${brandGradient(` ${title} `)}\n${content}\n`;
}
