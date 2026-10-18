// Clean article titles and summaries for display (and before saving).
// Removes HTML tags, including ones hidden behind entities (&lt;i&gt;), decodes
// entities, drops editorial marks like [UPDATED] / (VIDEO) on titles and
// aggregator footers ("[link] [comments]", "Discuss", "Link") on summaries.
// Mirrors engine/src/engine/agents/text_clean.py — keep the two in step.

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…", laquo: "«", raquo: "»",
  copy: "©", reg: "®", trade: "™", middot: "·", bull: "•", eacute: "é", egrave: "è",
};

function decodeOnce(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      try { return Number.isFinite(n) ? String.fromCodePoint(n) : m; } catch { return m; }
    }
    return NAMED[code.toLowerCase()] ?? m;
  });
}

function decode(s: string): string {
  for (let i = 0; i < 3; i++) { const n = decodeOnce(s); if (n === s) break; s = n; }
  return s;
}

const SCRIPT = /<(script|style)\b[\s\S]*?<\/\1\s*>/gi;
const BLOCK = /<\s*(?:br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi;
const TAG = /<\s*\/?\s*[a-zA-Z][^<>]*>|<!--[\s\S]*?-->/g;

export function stripHtml(s: string): string {
  if (!s) return "";
  const strip = (t: string) => t.replace(SCRIPT, " ").replace(BLOCK, " ").replace(TAG, "");
  return strip(decode(strip(s))).replace(/\u00a0/g, " ").replace(/\u200b/g, "");
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

const MARKS =
  "updated?|update \\d+|video|photos?|gallery|watch|listen|audio|podcast|live|breaking|exclusive|opinion|analysis|" +
  "sponsored|ad|paid|pdf|infographic|interactive|corrected|correction|editor'?s note|developing|paywall(?:ed)?|" +
  "oc|serious|meta|discussion|news|video inside|nsfw";
const LEAD = new RegExp(`^\\s*(?:[\\[(]\\s*(?:${MARKS})\\s*[\\])]\\s*[:\\-–—]?\\s*)+`, "i");
const TAIL = new RegExp(`(?:\\s*[\\[(]\\s*(?:${MARKS})\\s*[\\])])+\\s*$`, "i");

export function cleanTitle(s: string | null | undefined): string {
  let t = collapse(stripHtml(s || "")).replace(/\*\*|__|`/g, "");
  let prev = "";
  while (prev !== t) { prev = t; t = t.replace(LEAD, "").replace(TAIL, "").trim(); }
  return collapse(t) || collapse(s || "");
}

const FOOTERS: RegExp[] = [
  /submitted\s+by\s+\/?u\/[\w-]+(?:\s+to\s+\/?r\/[\w-]+)?/gi,
  /\[\s*link\s*\]/gi,
  /\[\s*\d*\s*comments?\s*\]/gi,
  /\b(?:Article|Comments)\s+URL:\s*\S+/gi,
  /\bPoints:\s*\d+/gi,
  /#\s*Comments:\s*\d+/gi,
  /\b(?:Read|Continue reading|Read more|Read the full (?:story|article))(?:\s+(?:at|on)\s+[\w .'-]+?)?\s*(?:\.\.\.|…|»|→)?\s*$/i,
  /\bThe post .{3,200}? appeared first on .{2,120}?\.?\s*$/i,
  /\bThis article (?:was )?originally appeared on .{2,120}?\.?\s*$/i,
  /\b(?:Discussion|Discuss|Link|Comments?|Share|Permalink)(?:\s*(?:\||·|•)\s*(?:Discussion|Discuss|Link|Comments?|Share|Permalink))*\s*$/, // capitalised only
  /^\s*(?:Discuss|Link)\s*(?:\||·|•|:)\s*/,
  /\[\s*Reddit r\/[\w-]+\s*\]/gi,
];

export function cleanSummary(s: string | null | undefined): string {
  let t = collapse(stripHtml(s || ""));
  let prev = "";
  while (prev !== t) {
    prev = t;
    for (const rx of FOOTERS) t = t.replace(rx, " ");
    t = collapse(t).replace(/^[\s|·•\-–—]+|[\s|·•\-–—]+$/g, "");
  }
  return t;
}
