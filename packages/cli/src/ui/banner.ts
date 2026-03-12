/**
 * forgelore CLI banner and branding
 * Anvil + book ASCII art with forge spark animations
 */

import boxen from "boxen";
import chalk from "chalk";
import gradient from "gradient-string";
import { colors } from "./theme.js";

// Brand gradients: forge (warm) → lore (cool)
const forgeGradient = gradient(["#FF6B35", "#FFD700"]);
const loreGradient = gradient(["#7C3AED", "#06B6D4"]);
const brandGradient = gradient(["#FF6B35", "#FFD700", "#7C3AED", "#06B6D4"]);
const sparkColor = chalk.hex("#FFD700");
const emberColor = chalk.hex("#FF6B35");

// Per-character gradient for FORGELORE title
const TITLE_GRADIENT = [
  "#FF6B35", // F - forge orange
  "#FF8E3C", // O
  "#FFB347", // R
  "#FFD700", // G - spark gold
  "#C9A832", // E
  "#9B6FC0", // L - transitioning
  "#7C3AED", // O - lore violet
  "#4196CB", // R
  "#06B6D4", // E - lore cyan
];

// Book (lore) sitting on anvil (forge)
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

const SPARK_CHARS = ["✦", "✧", "·", "✶", "∗"];

function getColoredBook(): string[] {
  return BOOK_LINES.map((l) => loreGradient(l));
}

function getColoredAnvil(): string[] {
  return ANVIL_LINES.map((l) => forgeGradient(l));
}

function getTitle(): string {
  return "FORGELORE"
    .split("")
    .map((ch, i) => chalk.bold(chalk.hex(TITLE_GRADIENT[i])(ch)))
    .join("");
}

function randomSpark(): string {
  return sparkColor(
    SPARK_CHARS[Math.floor(Math.random() * SPARK_CHARS.length)]
  );
}

function generateSparkLine(width = 30): string {
  const chars = new Array(width).fill(" ");
  const count = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const pos = Math.floor(Math.random() * width);
    chars[pos] = randomSpark();
  }
  return chars.join("");
}

// ANSI helpers
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_LINE = "\x1b[2K";
function moveUp(n: number): string {
  return n > 0 ? `\x1b[${n}A` : "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Static banner — used in non-TTY or when animation isn't wanted
 */
export function renderBanner(): string {
  const book = getColoredBook().join("\n");
  const anvil = getColoredAnvil().join("\n");
  const title = `  ${getTitle()}`;
  const tagline = colors.muted("  forge knowledge, shape code");
  const version = chalk.dim("  v0.1.0");
  return `\n${book}\n${anvil}\n\n${title}\n${tagline}${version}\n`;
}

/**
 * Animated banner — anvil rises, book drops, sparks fly, title types out
 * Only runs in interactive TTY; falls back to static otherwise
 */
export async function renderAnimatedBanner(): Promise<void> {
  if (!process.stdout.isTTY) {
    console.log(renderBanner());
    return;
  }

  const bookColored = getColoredBook();
  const anvilColored = getColoredAnvil();
  const allLines = [...bookColored, ...anvilColored];
  const totalHeight = allLines.length;

  process.stdout.write(HIDE_CURSOR);

  try {
    console.log(""); // top spacing

    // Phase 1: Anvil rises from below (bottom-up reveal)
    for (let i = anvilColored.length - 1; i >= 0; i--) {
      const visible = anvilColored.slice(i);
      for (const line of visible) {
        process.stdout.write(CLEAR_LINE + line + "\n");
      }
      await sleep(45);
      if (i > 0) {
        process.stdout.write(moveUp(visible.length));
      }
    }

    // Phase 2: Book drops onto anvil (top-down reveal)
    const anvilHeight = anvilColored.length;
    process.stdout.write(moveUp(anvilHeight));

    for (let i = bookColored.length - 1; i >= 0; i--) {
      const visibleBook = bookColored.slice(i);
      const frame = [...visibleBook, ...anvilColored];
      for (const line of frame) {
        process.stdout.write(CLEAR_LINE + line + "\n");
      }
      await sleep(35);
      process.stdout.write(moveUp(frame.length));
    }

    // Redraw complete art
    for (const line of allLines) {
      process.stdout.write(CLEAR_LINE + line + "\n");
    }

    // Phase 3: Sparks fly from the anvil
    for (let cycle = 0; cycle < 5; cycle++) {
      await sleep(90);
      process.stdout.write(moveUp(totalHeight));

      for (let i = 0; i < totalHeight; i++) {
        const line = allLines[i];
        // Add random sparks to the right of anvil lines and around the impact point
        let spark = "";
        if (i >= bookColored.length - 2 && i <= bookColored.length + 2) {
          // Near the book-anvil junction — more sparks
          if (Math.random() > 0.3) {
            spark = "  " + randomSpark();
            if (Math.random() > 0.5) spark += " " + randomSpark();
          }
        } else if (Math.random() > 0.7) {
          spark = "  " + randomSpark();
        }
        process.stdout.write(CLEAR_LINE + line + spark + "\n");
      }
    }

    // Final clean render (no sparks)
    process.stdout.write(moveUp(totalHeight));
    for (const line of allLines) {
      process.stdout.write(CLEAR_LINE + line + "\n");
    }

    // Phase 4: Title types out letter by letter
    console.log("");
    process.stdout.write("  ");
    const title = "FORGELORE";
    for (let i = 0; i < title.length; i++) {
      // Flash as ember block, then resolve to colored letter
      process.stdout.write(emberColor("█"));
      await sleep(35);
      process.stdout.write("\b" + chalk.bold(chalk.hex(TITLE_GRADIENT[i])(title[i])));
      await sleep(50);
    }
    console.log("");

    // Phase 5: Tagline fades in
    await sleep(200);
    console.log(colors.muted("  forge knowledge, shape code") + chalk.dim("  v0.1.0"));
    console.log("");
  } finally {
    process.stdout.write(SHOW_CURSOR);
  }
}

/**
 * Render a boxed section with forge-themed border
 */
export function renderBox(
  content: string,
  title?: string,
  borderColor = "#FF6B35"
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
