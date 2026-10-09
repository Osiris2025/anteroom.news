/**
 * The "Anteroom" wordmark with its leading "A" drawn as the A-Doorway glyph
 * from the site icon (src/app/icon.svg): the same A shape with the arched
 * doorway cut through it, but with no tile behind it.
 *
 * - The glyph is filled with `currentColor`, so it always matches the header
 *   text colour of whichever theme is active.
 * - The doorway is a real cut-out (even-odd fill), so the header background
 *   shows through it on every theme, light or dark.
 * - It is sized to the font's cap height (`1cap`, with an em fallback) and sits
 *   on the text baseline, so it lines up with "nteroom" in any theme font.
 * - Screen readers hear "Anteroom" once; the visual pieces are aria-hidden.
 */

// Same geometry as the site icon (src/app/icon.svg), cropped to the letter's bounds.
const GLYPH_PATH =
  "M218 92H294L424 420H88Z M200 420V282A56 56 0 0 1 312 282V420Z";

export function DoorwayA({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`ar-doorway-a ${className}`.trim()}
      viewBox="88 92 336 328"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={GLYPH_PATH} />
    </svg>
  );
}

export default function AnteroomWordmark() {
  return (
    <>
      <span className="sr-only">Anteroom</span>
      <span aria-hidden="true" className="ar-wordmark">
        <DoorwayA />
        nteroom
      </span>
    </>
  );
}
