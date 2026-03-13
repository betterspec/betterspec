/**
 * betterspec CLI banner and branding
 * Big gradient text logo, like Claude Code / Gemini CLI style.
 *
 * Animation: letters materialize from ember blocks, the full logo
 * gradient sweeps from warm to cool, then the tagline fades in.
 */

import boxen from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";
import { colors } from "./theme.js";

// ─── Sedona Brand Palette ────────────────────────────────────

const SEDONA         = "#CC5500"; // deep Sedona red-rock
const SEDONA_GLOW    = "#E07020"; // bright warm Sedona
const SEDONA_SUNSET  = "#F5A050"; // sunset gold
const BRAND_VIOLET   = "#7C3AED"; // brand violet
const BRAND_CYAN     = "#06B6D4"; // brand cyan
const DARK           = "#2A2A2A"; // cold / unlit
const FLASH_WARM     = "#FFF0D0"; // warm-white impact flash

// Brand gradient: Sedona warm → cool
const betterspecGradient = gradient([SEDONA, SEDONA_SUNSET, BRAND_VIOLET, BRAND_CYAN]);
const brandGradient = betterspecGradient;

// ─── Big Text Logo ───────────────────────────────────────────
//
// FIGlet-style block letters for "betterspec"
// Font style: chunky/bold, 6 lines tall

const LOGO_LINES = [
  " ██████  ███████ ████████ ████████ ███████ ██████  ███████ ██████  ███████  ██████ ",
  " ██   ██ ██         ██       ██    ██      ██   ██ ██      ██   ██ ██      ██      ",
  " ██████  █████      ██       ██    █████   ██████  ███████ ██████  █████   ██      ",
  " ██   ██ ██         ██       ██    ██      ██   ██      ██ ██      ██      ██      ",
  " ██████  ███████    ██       ██    ███████ ██   ██ ███████ ██      ███████  ██████ ",
];

const TOTAL_LOGO_LINES = LOGO_LINES.length;

// Spark characters with warm Sedona color pools
const SPARK_POOL = [
  { char: "\u2726", bright: ["#F5A050", "#FFD090", "#FFF0D0"] }, // ✦
  { char: "\u2727", bright: ["#FFD090", "#FFF0D0"] },             // ✧
  { char: "\u2736", bright: ["#E07020", "#F5A050"] },             // ✶
  { char: "\u2217", bright: ["#CC5500", "#E07020"] },             // ∗
  { char: "\u00B7", bright: ["#F5A050", "#FFD090"] },             // ·
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

// ─── Logo Coloring ───────────────────────────────────────────

/**
 * Color the logo at a given heat level.
 *   heat  — 0 (cold/dark) to 1 (full brand gradient)
 *   flash — 0–1, push colors toward warm-white
 */
function colorLogo(heat: number, flash = 0): string[] {
  const t = Math.max(0, Math.min(1, heat));
  const f = Math.max(0, Math.min(1, flash));

  if (t < 0.01) {
    // Completely dark — barely visible solid color
    const col = lerpHex(DARK, "#333333", 0.5);
    return LOGO_LINES.map((line) => chalk.hex(col)(line));
  }

  // Build the gradient stops, modulated by heat (dark → full color)
  const stops = [SEDONA, SEDONA_SUNSET, BRAND_VIOLET, BRAND_CYAN].map((c) => {
    const base = lerpHex(DARK, c, t);
    return f > 0 ? lerpHex(base, FLASH_WARM, f) : base;
  });

  const grad = gradient(stops);
  return LOGO_LINES.map((line) => grad(line));
}

// ─── Sparks ──────────────────────────────────────────────────

function randomSpark(bright = true): string {
  const s = SPARK_POOL[Math.floor(Math.random() * SPARK_POOL.length)];
  const pool = bright ? s.bright : EMBER_COLORS;
  return chalk.hex(pool[Math.floor(Math.random() * pool.length)])(s.char);
}

/**
 * Spark decorations that fly off the logo to the right.
 *   0 = tight burst, 1–2 = expanding, 3 = embers, 4+ = clear
 */
function sparkOverlay(frame: number): Map<number, string> {
  const sp = new Map<number, string>();

  if (frame === 0) {
    sp.set(0, " " + randomSpark() + randomSpark());
    sp.set(1, "  " + randomSpark() + " " + randomSpark());
    sp.set(2, " " + randomSpark() + randomSpark());
    sp.set(3, "  " + randomSpark());
    sp.set(4, " " + randomSpark());
  } else if (frame === 1) {
    sp.set(0, "   " + randomSpark() + "  " + randomSpark());
    sp.set(1, "    " + randomSpark());
    sp.set(2, "   " + randomSpark() + " " + randomSpark());
    sp.set(3, "    " + randomSpark());
    sp.set(4, "   " + randomSpark() + "  " + randomSpark());
  } else if (frame === 2) {
    sp.set(0, "      " + randomSpark(false));
    sp.set(2, "     " + randomSpark());
    sp.set(4, "      " + randomSpark(false));
  } else if (frame === 3) {
    sp.set(1, "        " + randomSpark(false));
    sp.set(3, "       " + randomSpark(false));
  }
  return sp;
}

// ─── Frame Output ────────────────────────────────────────────

function writeFrame(lines: string[], sparks: Map<number, string>): void {
  for (let i = 0; i < lines.length; i++) {
    process.stdout.write(CLEAR_LINE + lines[i] + (sparks.get(i) || "") + "\n");
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Static banner — used in non-TTY or when animation is skipped
 */
export function renderBanner(): string {
  const logo = colorLogo(1).join("\n");
  const tagline = colors.muted("  better specs, better code");
  const version = chalk.dim("  v0.3.2");
  return `\n${logo}\n\n${tagline}${version}\n`;
}

/**
 * Animated banner — logo heats up, sparks fly, tagline fades in
 *
 * Timeline (~1.2s):
 *   Cold reveal    100ms  (5 lines × 20ms)
 *   Heat-up        330ms  (6 steps × 55ms)
 *   Spark burst    260ms  (4 frames × 65ms)
 *   Tagline        150ms  (pause + print)
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
    const coldLogo = colorLogo(0.06);
    for (const line of coldLogo) {
      process.stdout.write(CLEAR_LINE + line + "\n");
      await sleep(20);
    }

    // ── Phase 2: Heat-up ──────────────────────────────────────
    // Logo warms from dark to full brand gradient
    const heatSteps = [0.12, 0.25, 0.45, 0.65, 0.85, 1.0];
    for (const heat of heatSteps) {
      process.stdout.write(moveUp(TOTAL_LOGO_LINES));
      const frame = colorLogo(heat);
      for (const line of frame) {
        process.stdout.write(CLEAR_LINE + line + "\n");
      }
      await sleep(55);
    }

    // ── Phase 3: Flash + spark burst ──────────────────────────
    process.stdout.write(moveUp(TOTAL_LOGO_LINES));
    writeFrame(colorLogo(1.0, 0.5), sparkOverlay(0));
    await sleep(65);

    for (let f = 1; f <= 3; f++) {
      const flashDecay = Math.max(0, 0.35 - f * 0.12);
      process.stdout.write(moveUp(TOTAL_LOGO_LINES));
      writeFrame(colorLogo(1.0, flashDecay), sparkOverlay(f));
      await sleep(65);
    }

    // Clean final logo
    process.stdout.write(moveUp(TOTAL_LOGO_LINES));
    writeFrame(colorLogo(1.0), new Map());

    // ── Phase 4: Tagline ──────────────────────────────────────
    await sleep(150);
    console.log("");
    console.log(
      colors.muted("  better specs, better code") + chalk.dim("  v0.3.2")
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
