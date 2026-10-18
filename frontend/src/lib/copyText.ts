// Copy text to the clipboard. Uses navigator.clipboard where allowed and falls
// back to a hidden textarea + execCommand("copy") for older browsers and iOS
// Safari cases where the Clipboard API is unavailable or refused.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "0";
    ta.style.opacity = "0"; ta.style.fontSize = "16px"; // 16px stops iOS zooming
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS needs an explicit range
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}
