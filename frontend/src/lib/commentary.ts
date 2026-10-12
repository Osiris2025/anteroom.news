// Shared commentary ("Just my opinion") writing guidance, validation and cleanup.
//
// Used by every place that writes article.commentary with the AI:
//   - /api/admin/generate-commentary  (the ↻ Commentary button)
//   - /api/admin/batch-commentary
//   - /api/admin/link-drop
// The engine mirrors these rules in engine/src/engine/agents/commentary_style.py;
// keep the two in sync. CATBOY entertainment (generate-entertainment) is a
// deliberately different satire format and does not use this module.
//
// Pure functions only (no DB, no React), so it is safe to import from server
// routes and from client components (CommentaryBody uses cleanCommentary*).

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
export const COMMENTARY_FALLBACK_MODEL = "deepseek/deepseek-v4-flash-0731";

/**
 * Extra OpenRouter request options for commentary calls. Low reasoning effort
 * with the reasoning hidden stops the model pasting its own self-check notes
 * into the answer (seen in testing: "Let me verify: 3 paragraphs, ~165
 * words..." followed by the piece repeated five times), and it is ~6x cheaper.
 */
export const COMMENTARY_REQUEST_OPTIONS = {
  reasoning: { effort: "low", exclude: true },
  // Includes the (hidden) reasoning tokens. 1200 was too tight: in testing
  // about 1 call in 10 spent all 1200 on reasoning and returned nothing.
  max_tokens: 2000,
} as const;

export const COMMENTARY_STYLE_RULES = [
  "How to write it:",
  "- 2 to 4 short paragraphs, about 120-220 words in total.",
  "- Plain conversational prose, as if you were telling a smart friend what you make of the story. First person is fine (\"I think\", \"I'd want to know\") but don't overdo it.",
  "- Vary how you open. Start with the most interesting concrete detail or your actual opinion. Do not open with \"What strikes me\", \"Here's the thing\", \"Let's be clear\" or \"In a world where\".",
  "- Say why the story matters, what it connects to, and where you land on it. Weave these together naturally; do not announce them.",
  "- Be specific to this story. Use concrete details from what you're given. Do not invent facts, numbers, names or quotes.",
  "- It's fine to be uncertain or to say what you'd want to know next.",
  "",
  "Avoid these, because they make the writing look machine-made:",
  "- No headings, labels or lead-ins such as \"Take:\", \"Why this matters:\", \"What connects:\", \"The bottom line:\", \"Closer:\".",
  "- No markdown at all: no asterisks, no bold or italics, no bullets, no numbered lists, no # headings, no links or URLs.",
  "- Never use the \"this isn't X, it's Y\" / \"that's not X; it's Y\" / \"the question isn't X. It's Y\" contrast, with any punctuation (comma, dash, semicolon or a new sentence), and no \"not just X, but Y\". Say what you think directly.",
  "- No slogan-style closing lines or punchlines. End on a plain, honest thought.",
  "- Use em dashes sparingly (at most one in the whole piece). Prefer commas and periods.",
  "- Avoid buzzwords like \"signal\", \"game-changer\", \"paradigm\", \"landscape\", \"double-edged sword\", \"make no mistake\".",
  "",
  "Output format: only the commentary text. Separate paragraphs with one blank line. No title, no sign-off, no JSON, no notes about what you wrote.",
].join("\n");

export interface CommentaryPersona {
  agentName?: string | null;
  magazineName?: string | null;
  tone?: string | null;
  tagline?: string | null;
  description?: string | null;
}

/** System prompt: the magazine's own persona/tone + the shared style rules. */
export function buildCommentarySystem(p: CommentaryPersona): string {
  const agent = p.agentName || "the desk";
  const mag = p.magazineName || "Anteroom";
  const tone = p.tone || "neutral";
  const persona = [
    `You are ${agent}, the columnist who writes the "Just my opinion" note for "${mag}" on Anteroom.`,
    p.tagline ? `Magazine tagline: ${p.tagline}` : "",
    p.description ? `About ${mag}: ${p.description}` : "",
    `Your general outlook is ${tone}, and your voice should fit ${mag}. Write like a thoughtful person talking to a reader, not like a marketer or a pitch deck.`,
  ].filter(Boolean).join("\n");
  return `${persona}\n\n${COMMENTARY_STYLE_RULES}`;
}

/** User message: title + summary (+ optional excerpt). No source URL on purpose. */
export function buildCommentaryUser(a: { title: string; summary?: string | null; excerpt?: string | null }): string {
  const parts = [
    `Article title: ${a.title}`,
    a.summary ? `Summary: ${a.summary}` : "",
    a.excerpt ? `Article excerpt:\n${a.excerpt.slice(0, 4000)}` : "",
  ].filter(Boolean);
  return `${parts.join("\n")}\n\nWrite your commentary now.`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const RE_BOLD = /\*\*[^*\n]+\*\*|(^|\s)__[^_\n]+__/;
const RE_ITALIC = /(^|[^\w*])\*[^*\s][^*\n]{0,80}\*(?=[^\w*]|$)/m;
const RE_HEADING = /(^|\n)\s{0,3}#{1,6}\s/;
const RE_BULLET = /(^|\n)\s*(?:[-*•]|\d+[.)])\s+\S/;
const LABEL_WORDS =
  "take|the take|my take|why (?:this|it) matters|what (?:connects|it signals|it means)|the deeper truth|the real story|the numbers[^:\\n]{0,30}|bottom line|the bottom line|closer|the closer|verdict|kicker|the signal|context|connection";
const RE_LABEL = new RegExp(`(^|\\n)\\s*(?:\\*\\*)?\\s*(?:${LABEL_WORDS})\\s*(?:\\*\\*)?\\s*:`, "i");
const RE_META =
  /(?:^|[.!?]["”']?\s+)(?:let me (?:verify|double-check|finali[sz]e|re-?read|count|refine|structure|re-?check|check (?:the|that|all|my|again))|wait, i (?:already|need|should)|(?:that['’]s|this is) (?:about|roughly|around) \d+ words|checks?:\s|(?:the )?word count (?:is|looks|checks)|no headings, no)/i;
const RE_LINK = /https?:\/\/\S+|\[[^\]]+\]\([^)]+\)/;
const RE_CONTRAST = [
  // "X isn't A, it's B" / "isn't A—it's B" / "isn't A. It's B"
  /\b(?:isn['’]t|is not|wasn['’]t|aren['’]t|weren['’]t)\s+[^.;!?\n]{1,80}?(?:[,—–;]|\.\s)\s*(?:it['’]s|it is|it was|this is|they['’]re|that['’]s)\s/i,
  // "That's not A; it's B" / "That's not A, that's B" / "That's not A. It's B"
  /\b(?:that|this|it)['’]s not (?:just )?[^.;!?\n]{1,60}?(?:[,—–;]|\.\s)\s*(?:it['’]s|it is|that['’]s)\s/i,
  // "not just A, but B"
  /\bnot (?:just|merely|simply|only) [^.;!?\n]{1,60},? but (?:also )?/i,
];

function paragraphsOf(text: string): string[] {
  return text.replace(/\r\n?/g, "\n").split(/\n\s*\n+/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
}

// "Ends with a complete sentence": the last paragraph must finish with . ! or ?
// (optionally followed by closing quotes/brackets), must not trail off with an
// ellipsis, and must not end on a word that can't finish a sentence ("the.").
const RE_TERMINAL_END = /[.!?]["”’')\]]*$/;
const RE_ELLIPSIS_END = /(?:\.\.\.|…)["”’')\]]*$/;
const RE_DANGLING_END = /\b(?:a|an|the|and|or|but|nor|than|because|whether|its|their|our|your|my)[.!?]["”’')\]]*$/i;

/** True when the text stops mid-sentence (cut off, trailing ellipsis, dangling word). */
export function endsIncomplete(text: string | null | undefined): boolean {
  const paras = paragraphsOf(text || "");
  if (paras.length === 0) return false; // empty is reported as "too short"
  const last = paras[paras.length - 1];
  return !RE_TERMINAL_END.test(last) || RE_ELLIPSIS_END.test(last) || RE_DANGLING_END.test(last);
}

export const PROBLEM_CUT_OFF = "ends mid-sentence (cut off)";

/** Returns a list of human-readable problems; empty array means it passes. */
export function validateCommentary(text: string | null | undefined): string[] {
  const t = (text || "").trim();
  const problems: string[] = [];
  if (t.length < 120) problems.push("too short");
  if (RE_BOLD.test(t) || RE_ITALIC.test(t) || RE_HEADING.test(t) || RE_BULLET.test(t)) problems.push("markdown formatting (asterisks, headings or bullets)");
  if (RE_LABEL.test(t)) problems.push('section labels like "Take:" or "Why this matters:"');
  if (RE_META.test(t)) problems.push("notes about the writing itself (word counts, self-checks)");
  if (RE_LINK.test(t)) problems.push("a URL or link");
  if (RE_CONTRAST.some((re) => re.test(t))) problems.push(`the "this isn't X, it's Y" / "not just X, but Y" construction`);
  const paras = paragraphsOf(t);
  const seen = new Set<string>();
  let dup = false;
  for (const p of paras) {
    const k = p.toLowerCase();
    if (seen.has(k)) dup = true;
    seen.add(k);
  }
  // Also catch a piece repeated back-to-back without a blank line between copies.
  if (!dup && paras.length > 0) {
    const first = paras[0].slice(0, 80);
    if (first.length >= 40 && t.indexOf(first, t.indexOf(first) + first.length) !== -1) dup = true;
  }
  if (dup) problems.push("repeated paragraphs");
  if (paras.length > 6) problems.push("too many paragraphs");
  if (t.length > 0 && endsIncomplete(t)) problems.push(PROBLEM_CUT_OFF);
  return problems;
}

/** Up to `max` offending snippets (contrast lines, labels, markdown) to quote back on retry. */
export function problemExamples(text: string | null | undefined, max = 4): string[] {
  const t = (text || "").replace(/\s+/g, " ");
  const out: string[] = [];
  const sentences = t.split(/(?<=[.!?])\s+(?=[A-Z"“])/);
  for (let i = 0; i < sentences.length && out.length < max; i++) {
    const pair = sentences[i] + (sentences[i + 1] ? " " + sentences[i + 1] : "");
    if (RE_CONTRAST.some((re) => re.test(sentences[i]))) out.push(sentences[i].trim());
    else if (RE_CONTRAST.some((re) => re.test(pair))) { out.push(pair.trim()); i++; }
  }
  const lab = t.match(new RegExp(`(?:\\*\\*)?\\s*(?:${LABEL_WORDS})\\s*(?:\\*\\*)?\\s*:`, "i"));
  if (lab && out.length < max) out.push(lab[0].trim());
  return out.map((x) => (x.length > 220 ? x.slice(0, 217) + "..." : x));
}

// ---------------------------------------------------------------------------
// Cleanup (used for display of legacy text, and as the save-fallback)
// ---------------------------------------------------------------------------

const LABEL_LEAD = new RegExp(`^\\s*(?:${LABEL_WORDS})\\s*:\\s*`, "i");

/** Strips stray markdown, labels, Source lines, self-check notes and duplicates. */
export function cleanCommentaryParagraphs(raw: string | null | undefined): string[] {
  let t = (raw || "").replace(/\r\n?/g, "\n");
  // A trailing ```json {...}``` ai_thoughts block or bare fences
  t = t.replace(/```[a-z]*\s*[\s\S]*?```/gi, "");
  // Stray HTML: keep link text, drop tags (commentary is rendered as escaped text).
  t = t.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1").replace(/<br\s*\/?>/gi, "\n").replace(/<\/?p\b[^>]*>/gi, "\n\n");
  t = t.replace(/<\/?(?:a|b|strong|i|em|u|span|div|h[1-6]|ul|ol|li|blockquote|code)\b[^>]*>/gi, "");
  // # headings: short ones are just labels ("# Verdict") and are dropped;
  // longer ones become their own paragraph.
  t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+(.*)$/gm, (_m, h: string) => (h.trim().split(/\s+/).length <= 8 ? "\n" : `\n${h}\n`));
  // Each bullet / numbered item becomes its own paragraph.
  t = t.replace(/\n(?=[ \t]*(?:[-*•]|\d+[.)])[ \t]+\S)/g, "\n\n");
  t = t.replace(/\*\*([^*\n]+?)\*\*/g, "$1").replace(/__([^_\n]+?)__/g, "$1");     // bold
  t = t.replace(/(^|[^\w*])\*([^*\s][^*\n]*?)\*(?=[^\w*]|$)/gm, "$1$2");           // *italic*
  t = t.replace(/(^|[^\w_])_([^_\s][^_\n]*?)_(?=[^\w_]|$)/gm, "$1$2");               // _italic_
  t = t.replace(/^[ \t]*(?:[-*•]|\d+[.)])[ \t]+/gm, "");                                 // bullets
  t = t.replace(/\[([^\]]+)\]\((?:https?:)?[^)]+\)/g, "$1");                       // [text](url)
  t = t.replace(/(^|\n)[ \t]*(?:Source|Read more|Via)\s*:\s*\S+[ \t]*(?=\n|$)/gi, "$1"); // Source: line
  t = t.replace(/\s*\(?(?:Source|Via)\s*:\s*https?:\/\/[^\s)]+\)?/gi, "");           // inline Source: url
  t = t.replace(/\s*\(https?:\/\/[^)\s]+\)/g, "");                                  // (https://...)
  t = t.replace(/\b(from|at|via|see|on)\s+https?:\/\/[^\s)]+/gi, "$1 the source");   // "from https://..."
  t = t.replace(/<a\b[^>]*$/gi, "");                                                  // cut-off <a href=...
  t = t.replace(/\\?["”]?\s*,\s*\\?"confidence\\?"\s*:\s*[\d.]+\s*\}\s*(?:```)?\s*$/, ""); // leaked JSON tail
  t = t.replace(/https?:\/\/[^\s)]*/g, "").replace(/\(\s*\)/g, "").replace(/[ \t]+([.,;:])/g, "$1"); // bare URLs
  t = t.replace(/(^|\s)\*\*(?=[^\s*])/g, "$1").replace(/(?<=[^\s*])\*\*(?=[\s.,;:!?]|$)/g, ""); // unpaired **
  const out: string[] = [];
  const seen = new Set<string>();
  for (let p of t.split(/\n\s*\n+/)) {
    p = p.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
    p = p.replace(LABEL_LEAD, "");
    if (p) p = p.charAt(0).toUpperCase() + p.slice(1);
    if (!p || /^[\s.,;:—–-]*$/.test(p)) continue;
    if (RE_META.test(p)) continue;                    // drop "Let me verify..." notes
    const key = p.toLowerCase();
    if (seen.has(key)) continue;                      // drop exact duplicates
    seen.add(key);
    out.push(p);
  }
  // A last paragraph that was cut off mid-sentence: keep it up to its last
  // complete sentence, or drop it if it has none (never drop the only paragraph).
  const last = out[out.length - 1];
  if (last && !RE_TERMINAL_END.test(last)) {
    const m = last.match(/^[\s\S]*[.!?]["”’')\]]*(?=\s)/);
    if (m && m[0].trim().length >= 20) out[out.length - 1] = m[0].trim();
    else if (out.length > 1) out.pop();
  }
  return out;
}

export function cleanCommentary(raw: string | null | undefined): string {
  return cleanCommentaryParagraphs(raw).join("\n\n");
}

// ---------------------------------------------------------------------------
// Generation with validate-and-retry-once
// ---------------------------------------------------------------------------

export interface CommentaryResult {
  /** Text to store. null = nothing usable (keep the old text). */
  text: string | null;
  /** True when an attempt passed validation as-is. */
  passed: boolean;
  /** Problems left in the best attempt when it did not pass (before cleanup). */
  problems: string[];
  attempts: number;
  model: string;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CallResult = { text: string; finishReason: string };

async function callOnce(apiKey: string, model: string, messages: ChatMessage[], timeoutMs: number): Promise<CallResult> {
  const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://anteroom.news",
      "X-Title": "Anteroom",
    },
    body: JSON.stringify({
      model,
      ...COMMENTARY_REQUEST_OPTIONS,
      messages,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`OpenRouter ${resp.status}: ${body.slice(0, 300)}`);
  }
  const data: any = await resp.json().catch(() => null);
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  // Empty content (e.g. finish_reason "length" after a reasoning runaway) is
  // treated as a failed attempt so the caller retries, not as a hard error.
  return {
    text: typeof content === "string" ? content.trim() : "",
    finishReason: String(choice?.finish_reason || choice?.native_finish_reason || ""),
  };
}

/** Validator problems for one API reply; hitting the token limit counts as cut off. */
function problemsFor(r: CallResult): string[] {
  const p = validateCommentary(r.text);
  if (r.finishReason === "length" && !p.includes(PROBLEM_CUT_OFF)) p.push(PROBLEM_CUT_OFF);
  return p;
}

/**
 * Writes commentary, validates it, and retries once (telling the model what
 * was wrong). If both attempts fail validation:
 *   - mode "replace" (regenerating existing commentary): returns text=null so
 *     the caller keeps the old commentary, unless the old commentary breaks
 *     more rules than a cleaned-up version of the new attempt;
 *   - mode "new" (article has none yet): returns a cleaned version of the
 *     better attempt so the article still gets readable commentary.
 * Network/API errors on the first attempt are thrown to the caller.
 */
export async function generateCommentary(opts: {
  apiKey: string;
  model?: string | null;
  system: string;
  user: string;
  mode: "new" | "replace";
  /** Current commentary (mode "replace"), used to decide whether to keep it. */
  existing?: string | null;
  timeoutMs?: number;
}): Promise<CommentaryResult> {
  const model = opts.model || COMMENTARY_FALLBACK_MODEL;
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const base: ChatMessage[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  const r1 = await callOnce(opts.apiKey, model, base, timeoutMs);
  const first = r1.text;
  const p1 = problemsFor(r1);
  if (p1.length === 0) return { text: first, passed: true, problems: [], attempts: 1, model };

  let second = "";
  let secondProblems: string[] = validateCommentary("");
  let attempts = 1;
  try {
    // Retry as a revision of the first draft (keeps the good parts), quoting
    // the offending lines back. An empty first draft gets a fresh request.
    const examples = problemExamples(first);
    const feedback = [
      `That draft breaks the style rules: ${p1.join("; ")}.`,
      examples.length ? `Rewrite these parts in plain, direct sentences:\n${examples.map((e) => `- "${e}"`).join("\n")}` : "",
      p1.includes(PROBLEM_CUT_OFF) ? "It stopped mid-sentence. Keep it a little shorter and end on a complete sentence." : "",
      "Return the full revised commentary only, following every rule.",
    ].filter(Boolean).join("\n");
    const retryMessages: ChatMessage[] = first
      ? [...base, { role: "assistant", content: first }, { role: "user", content: feedback }]
      : base;
    attempts = 2;
    const r2 = await callOnce(opts.apiKey, model, retryMessages, timeoutMs);
    second = r2.text;
    secondProblems = problemsFor(r2);
  } catch {
    second = "";
  }
  const p2 = secondProblems;
  if (second && p2.length === 0) return { text: second, passed: true, problems: [], attempts, model };

  // Neither passed. Prefer a non-empty attempt, then the one with fewer problems.
  const useSecond = !!second && (!first || p2.length <= p1.length);
  const best = useSecond ? second : first;
  const bestProblems = useSecond ? p2 : p1;
  if (!best) return { text: null, passed: false, problems: bestProblems, attempts, model };
  if (opts.mode === "replace") {
    // Keep the existing commentary unless the new attempt, cleaned up, is
    // clearly better than it (e.g. the old one has markdown or labels).
    const cleanedNew = cleanCommentary(best);
    const newScore = validateCommentary(cleanedNew).length;
    const oldScore = validateCommentary(opts.existing || "").length;
    if (!opts.existing || newScore >= oldScore || cleanedNew.length < 40) {
      return { text: null, passed: false, problems: bestProblems, attempts, model };
    }
    return { text: cleanedNew, passed: false, problems: bestProblems, attempts, model };
  }
  const cleaned = cleanCommentary(best);
  return { text: cleaned.length >= 40 ? cleaned : null, passed: false, problems: bestProblems, attempts, model };
}
