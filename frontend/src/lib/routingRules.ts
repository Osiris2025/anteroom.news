// Shared magazine routing rules (frontend side).
// The rules live in routing-rules.json, which the engine also reads (mounted
// read-only at /app/routing-rules.json; see engine/src/engine/agents/routing.py).
// Keep the two implementations in step: NASA first, then AI, then AI-security.
import RULES from "./routing-rules.json";

export type RouteResult = {
  magazineId: string;
  rule: "nasa-science" | "nasa-money" | "nasa-theory" | "ai" | "ai-security" | "security-tech";
  detail?: string;
};

type Exclusion = { remove: string; when?: string; flags?: string };

const rx = (p?: string, flags?: string) => (p ? new RegExp(p, (flags || "").includes("i") ? "i" : "") : null);
const rxAll = (p: string, flags?: string) => new RegExp(p, ((flags || "").includes("i") ? "i" : "") + "g");

const R: any = RULES;
const MAGS = R.magazines as Record<string, string>;
const NASA = {
  hosts: (R.nasa.source_hosts as string[]).map((h) => h.toLowerCase()),
  names: new Set((R.nasa.source_names as string[]).map((s) => s.trim().toLowerCase())),
  title: rx(R.nasa.title_pattern, R.nasa.title_flags),
  theory: rx(R.nasa.theoretical_pattern, R.nasa.theoretical_flags),
  money: rx(R.nasa.money_pattern, R.nasa.money_flags),
};
const AI = {
  hosts: (R.ai.publisher_hosts as string[]).map((h) => h.toLowerCase()),
  names: new Set((R.ai.publisher_source_names as string[]).map((s) => s.trim().toLowerCase())),
  title: rx(R.ai.title_pattern, R.ai.title_flags),
  exclusions: (R.ai.exclusions as Exclusion[]).map((e) => ({
    remove: rxAll(e.remove, e.flags),
    when: e.when ? rx(e.when, e.flags) : null,
  })),
};
const SEC = {
  hosts: (R.ai_security.source_hosts as string[]).map((h) => h.toLowerCase()),
  names: new Set((R.ai_security.source_names as string[]).map((s) => s.trim().toLowerCase())),
  title: rx(R.ai_security.title_pattern, R.ai_security.title_flags),
  fallback: (R.ai_security.default_magazine as string) || MAGS.tech,
};

/** Plain-language routing guidance to append to the AI "pick a magazine" prompts. */
export const ROUTING_PROMPT_GUIDANCE: string = (R.prompt_guidance as string[]).join("\n");

function hostOf(url?: string | null): string {
  try {
    const h = new URL(url || "").hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return "";
  }
}
const hostIn = (host: string, list: string[]) => !!host && list.some((h) => host === h || host.endsWith("." + h));

/** The AI company/product named in a headline (after false-positive exclusions), or null. */
export function aiMatch(title: string, summary = ""): string | null {
  if (!AI.title || !title) return null;
  let t = title;
  const ctx = `${title} ${summary || ""}`;
  for (const e of AI.exclusions) {
    if (!e.when || e.when.test(ctx)) t = t.replace(e.remove, " ");
  }
  const m = t.match(AI.title);
  return m ? m[0] : null;
}

/**
 * Shared-rules destination for an article, or null to keep the magazine the
 * AI (or the feed) picked. Callers must let an admin's explicit choice win.
 */
export function routeArticle(a: {
  title?: string | null; summary?: string | null; sourceUrl?: string | null; sourceName?: string | null;
}): RouteResult | null {
  const title = a.title || "";
  const host = hostOf(a.sourceUrl);
  const sname = (a.sourceName || "").trim().toLowerCase();

  if (hostIn(host, NASA.hosts) || NASA.names.has(sname) || (NASA.title && NASA.title.test(title))) {
    if (NASA.theory && NASA.theory.test(title)) return { magazineId: MAGS.theory, rule: "nasa-theory" };
    const m = NASA.money ? title.match(NASA.money) : null;
    if (m) return { magazineId: MAGS.news, rule: "nasa-money", detail: m[0] };
    return { magazineId: MAGS.science, rule: "nasa-science" };
  }
  if (hostIn(host, AI.hosts) || AI.names.has(sname)) return { magazineId: MAGS.ai, rule: "ai", detail: "publisher source" };
  const term = aiMatch(title, a.summary || "");
  if (term) return { magazineId: MAGS.ai, rule: "ai", detail: term };
  if (hostIn(host, SEC.hosts) || SEC.names.has(sname)) {
    const m = SEC.title ? title.match(SEC.title) : null;
    return m ? { magazineId: MAGS.ai, rule: "ai-security", detail: m[0] } : { magazineId: SEC.fallback, rule: "security-tech" };
  }
  return null;
}

/** Apply the rules on top of an AI pick. An explicit admin choice always wins. */
export function applyRoutingRules(
  aiPick: string | null,
  a: { title?: string | null; summary?: string | null; sourceUrl?: string | null; sourceName?: string | null },
  explicit?: string | null,
): { magazineId: string | null; rule: RouteResult["rule"] | "explicit" | null } {
  if (explicit) return { magazineId: explicit, rule: "explicit" };
  const r = routeArticle(a);
  return r ? { magazineId: r.magazineId, rule: r.rule } : { magazineId: aiPick, rule: null };
}
