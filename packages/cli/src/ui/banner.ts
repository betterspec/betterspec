/**
 * forgelore CLI banner and branding
 * A tome with a forge scene on its cover — flames, anvil, and sparks.
 *
 * Animation: the book starts cold (barely visible), heats up to full
 * Sedona/lore color, flames flash and sparks erupt from the cover,
 * then the title forges letter by letter from ember to final color.
 */

import boxen from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";
import { colors } from "./theme.js";

// ─── Sedona Brand Palette ────────────────────────────────────

const SEDONA         = "#CC5500"; // deep Sedona red-rock
const SEDONA_GLOW    = "#E07020"; // bright warm Sedona
const SEDONA_SUNSET  = "#F5A050"; // sunset gold
const FLAME_BRIGHT   = "#FFD090"; // bright flame gold
const FLAME_TIP      = "#FFEECC"; // flame tip highlight
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

// ─── ASCII Art: Tome with Forge Cover ────────────────────────
//
//  The art is a book (double-line border) with a forge scene on the
//  cover: flames at top, anvil below. The spine/pages show at bottom.
//  Each inner content line is exactly 20 characters wide.

const INNER_W = 20;
const PAD = "    "; // left indent

// Inner content between ║ borders (each exactly 20 chars)
const FLAME_INNER = [
  "    \u00B7  \u2726    \u2726  \u00B7    ", // sparks: ·  ✦    ✦  ·
  "      \u2571\u2572 \u2571\u2572 \u2571\u2572      ", // tips:   ╱╲ ╱╲ ╱╲
  "       \u2572\u2571\u2572\u2571\u2572\u2571       ", // merge:  ╲╱╲╱╲╱
  "        \u2572\u2571\u2572\u2571        ", // base:   ╲╱╲╱
];

const ANVIL_INNER = [
  "      \u2554\u2550\u2550\u2567\u2550\u2550\u2557       ", // ╔══╧══╗
  "   \u2501\u2501\u2501\u2523\u2588\u2588\u2588\u2588\u2588\u252B\u2501\u2501\u2501    ", // ━━━╣█████╠━━━
  "      \u255A\u2550\u2550\u2564\u2550\u2550\u255D       ", // ╚══╤══╝
  "     \u2588\u2588\u2588\u2588\u2567\u2588\u2588\u2588\u2588\u2588     ", // ████╧█████
];

const EMPTY_INNER = "                    "; // 20 spaces
const SPINE_INNER = "\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593"; // 20× ▓

// Total art lines: top(1) + flame(4) + anvil(4) + empty(1) + divider(1) + spine(1) + bottom(1) = 13
const TOTAL_ART_LINES = 13;
const FLAME_START_ROW = 1; // first flame row in the frame

// Spark characters with warm Sedona color pools
const SPARK_POOL = [
  { char: "\u2726", bright: ["#F5A050", "#FFD090", "#FFF0D0"] }, // ✦
  { char: "\u2727", bright: ["#FFD090", "#FFF0D0"] },             // ✧
  { char: "\u2736", bright: ["#E07020", "#F5A050"] },             // ✶
  { char: "\u2217", bright: ["#CC5500", "#E07020"] },             // ∗
  { char: "\u00B7", bright: ["#F5A050", "#FFD090"] },             // ·
  { char: "\u02DA", bright: ["#CC8800", "#F5A050"] },             // ˚
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
 * Compose the full art frame at a given heat level.
 *
 *   heat  — 0 (cold/dark) to 1 (full color)
 *   flash — 0–1, brightens flame lines toward warm-white
 *
 * The book border uses lore violet, the flame content uses bright
 * warm gold, and the anvil uses Sedona orange. Each section gets
 * its own gradient so the forge "pops" against the cool frame.
 */
function colorArt(heat: number, flash = 0): string[] {
  const t = Math.max(0, Math.min(1, heat));
  const f = Math.max(0, Math.min(1, flash));

  // Border color (lore violet, modulated by heat)
  const bdrCol = lerpHex(DARK, LORE_VIOLET, t);
  const bdr = (s: string) => chalk.hex(bdrCol)(s);

  // Flame gradient: bright gold → sunset
  const flS = lerpHex(DARK, f > 0 ? lerpHex(FLAME_TIP, FLASH_WARM, f) : FLAME_TIP, t);
  const flE = lerpHex(DARK, f > 0 ? lerpHex(SEDONA_SUNSET, FLASH_WARM, f) : SEDONA_SUNSET, t);
  const flm = (s: string) => gradient([flS, flE])(s);

  // Anvil gradient: Sedona → sunset
  const avS = lerpHex(DARK, SEDONA, t);
  const avE = lerpHex(DARK, SEDONA_SUNSET, t);
  const anv = (s: string) => gradient([avS, avE])(s);

  // Spine: lore cyan
  const spnCol = lerpHex(DARK, LORE_CYAN, t);
  const spn = (s: string) => chalk.hex(spnCol)(s);

  // Book border characters
  const TOP    = PAD + "\u2554" + "\u2550".repeat(INNER_W) + "\u2557";       // ╔═══╗
  const DIV    = PAD + "\u2560" + "\u2550".repeat(INNER_W) + "\u2563";       // ╠═══╣
  const BOT    = PAD + "\u255A" + "\u2550".repeat(INNER_W) + "\u255D";       // ╚═══╝
  const L      = PAD + "\u2551";  // ║ (left border)
  const R      = "\u2551";        // ║ (right border)

  return [
    bdr(TOP),                                              // 0:  ╔════════════════════╗
    bdr(L) + flm(FLAME_INNER[0]) + bdr(R),                // 1:  ║ sparks             ║
    bdr(L) + flm(FLAME_INNER[1]) + bdr(R),                // 2:  ║ flame tips         ║
    bdr(L) + flm(FLAME_INNER[2]) + bdr(R),                // 3:  ║ flame merge        ║
    bdr(L) + flm(FLAME_INNER[3]) + bdr(R),                // 4:  ║ flame base         ║
    bdr(L) + anv(ANVIL_INNER[0]) + bdr(R),                // 5:  ║ anvil top          ║
    bdr(L) + anv(ANVIL_INNER[1]) + bdr(R),                // 6:  ║ anvil horn         ║
    bdr(L) + anv(ANVIL_INNER[2]) + bdr(R),                // 7:  ║ anvil waist        ║
    bdr(L) + anv(ANVIL_INNER[3]) + bdr(R),                // 8:  ║ anvil base         ║
    bdr(L + EMPTY_INNER + R),                              // 9:  ║                    ║
    bdr(DIV),                                              // 10: ╠════════════════════╣
    spn(L) + spn(SPINE_INNER) + spn(R),                    // 11: ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
    bdr(BOT),                                              // 12: ╚════════════════════╝
  ];
}

// ─── Sparks ──────────────────────────────────────────────────

function randomSpark(bright = true): string {
  const s = SPARK_POOL[Math.floor(Math.random() * SPARK_POOL.length)];
  const pool = bright ? s.bright : EMBER_COLORS;
  return chalk.hex(pool[Math.floor(Math.random() * pool.length)])(s.char);
}

/**
 * Spark decorations that appear to the RIGHT of the book frame,
 * as if sparks are escaping the tome. Centered on the flame rows.
 *   0 = tight burst, 1–2 = expanding, 3 = last embers, 4+ = clear
 */
function sparkOverlay(frame: number): Map<number, string> {
  const sp = new Map<number, string>();

  if (frame === 0) {
    // Tight burst near flames
    sp.set(1, "  " + randomSpark() + randomSpark());
    sp.set(2, "   " + randomSpark() + " " + randomSpark() + randomSpark());
    sp.set(3, "  " + randomSpark() + randomSpark());
    sp.set(4, " " + randomSpark());
  } else if (frame === 1) {
    // Expanding outward
    sp.set(0, "      " + randomSpark());
    sp.set(1, "    " + randomSpark() + " " + randomSpark());
    sp.set(2, "   " + randomSpark() + "  " + randomSpark());
    sp.set(3, "  " + randomSpark() + "   " + randomSpark());
    sp.set(4, "   " + randomSpark());
    sp.set(5, "    " + randomSpark());
  } else if (frame === 2) {
    // Wide, starting to fade
    sp.set(0, "        " + randomSpark(false));
    sp.set(1, "      " + randomSpark());
    sp.set(3, "    " + randomSpark(false) + "  " + randomSpark());
    sp.set(5, "      " + randomSpark(false));
  } else if (frame === 3) {
    // Last embers
    sp.set(0, "         " + randomSpark(false));
    sp.set(2, "       " + randomSpark(false));
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
  const title = `    ${getTitle()}`;
  const tagline = colors.muted("    forge knowledge, shape code");
  const version = chalk.dim("  v0.2.1");
  return `\n${art}\n\n${title}\n${tagline}${version}\n`;
}

/**
 * Animated banner — forge heat-up, spark burst, title forging
 *
 * Timeline (~1.5s):
 *   Cold reveal    260ms  (13 lines × 20ms)
 *   Heat-up        330ms  (6 steps × 55ms)
 *   Spark burst    325ms  (5 frames × 65ms)
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
    const coldArt = colorArt(0.08);
    for (const line of coldArt) {
      process.stdout.write(CLEAR_LINE + line + "\n");
      await sleep(20);
    }

    // ── Phase 2: Heat-up ──────────────────────────────────────
    const heatSteps = [0.15, 0.30, 0.50, 0.70, 0.85, 1.0];
    for (const heat of heatSteps) {
      process.stdout.write(moveUp(TOTAL_ART_LINES));
      const frame = colorArt(heat);
      for (const line of frame) {
        process.stdout.write(CLEAR_LINE + line + "\n");
      }
      await sleep(55);
    }

    // ── Phase 3: Flash + spark burst ──────────────────────────
    // Flames flash white-hot, sparks fly out of the book
    process.stdout.write(moveUp(TOTAL_ART_LINES));
    writeFrame(colorArt(1.0, 0.6), sparkOverlay(0));
    await sleep(65);

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
    console.log("");
    process.stdout.write("    ");
    const title = "FORGELORE";
    for (let i = 0; i < title.length; i++) {
      process.stdout.write(chalk.hex(SEDONA_GLOW)("\u2588"));
      await sleep(15);
      process.stdout.write("\b" + chalk.hex("#CC7744")("\u2593"));
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
      colors.muted("    forge knowledge, shape code") + chalk.dim("  v0.2.1")
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
