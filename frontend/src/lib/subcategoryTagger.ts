// Server-only: pick a subcategory for an article in a given magazine, using the
// same rules as the engine (engine/src/engine/agents/subcategory.py):
//   1. magazine_taxonomy keywords, in position order, first match wins
//      (a keyword starting with a letter/digit must start at a word start);
//   2. if nothing matches, one cheap LLM call restricted to that magazine's slugs.
// Returns null when the magazine has no subcategories or nothing fits.
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { subcatDescription, subcatLabel } from "@/lib/subcategories";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = process.env.SUBCAT_LLM_MODEL || "deepseek/deepseek-v4-flash-0731";

type Tax = { slug: string; keywords: string[] }[];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function matchKeywords(tax: Tax, title: string, summary?: string | null): string | null {
  const corpus = `${title || ""} ${summary || ""}`.toLowerCase();
  for (const { slug, keywords } of tax) {
    for (const raw of keywords) {
      const kw = (raw || "").toLowerCase();
      if (!kw) continue;
      const re = /^[a-z0-9]/.test(kw) ? new RegExp(`(^|[^a-z0-9])${escapeRe(kw)}`) : new RegExp(escapeRe(kw));
      if (re.test(corpus)) return slug;
    }
  }
  return null;
}

export async function loadTaxonomy(magazineId: string): Promise<Tax> {
  try {
    const rows: any = await db.execute(sql`
      SELECT subcategory, keywords FROM magazine_taxonomy
      WHERE magazine_id = ${magazineId} ORDER BY position`);
    const list: any[] = Array.isArray(rows) ? rows : rows?.rows || [];
    return list.map((r) => ({
      slug: String(r.subcategory),
      keywords: Array.isArray(r.keywords) ? r.keywords.map(String) : [],
    }));
  } catch {
    return [];
  }
}

async function llmPick(magazineId: string, tax: Tax, title: string, summary?: string | null): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || process.env.SUBCAT_LLM_FALLBACK === "0") return null;
  const slugs = tax.map((t) => t.slug);
  const system = [
    "You file a news article into ONE subcategory of a magazine section. Allowed slugs:",
    ...tax.map((t) => `- ${t.slug}: ${subcatDescription(magazineId, t.slug) || subcatLabel(t.slug, magazineId) + " (keywords: " + t.keywords.slice(0, 10).join(", ") + ")"}`),
    'Reply with JSON only: {"sub":"<slug>"}',
  ].join("\n");
  try {
    const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Title": "Anteroom subcategories" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${title}\n${(summary || "").slice(0, 400)}` },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const txt = String(data?.choices?.[0]?.message?.content || "").replace(/```json\s*|```/gi, "").trim();
    const sub = String(JSON.parse(txt)?.sub || "").trim();
    return slugs.includes(sub) ? sub : null;
  } catch {
    return null;
  }
}

/** Subcategory for an article in `magazineId` (keywords, then cheap LLM), or null. */
export async function tagSubcategory(
  magazineId: string | null | undefined,
  title: string | null | undefined,
  summary?: string | null,
  opts: { llm?: boolean } = {},
): Promise<string | null> {
  if (!magazineId || !title) return null;
  const tax = await loadTaxonomy(magazineId);
  if (!tax.length) return null;
  const hit = matchKeywords(tax, title, summary);
  if (hit) return hit;
  return opts.llm === false ? null : llmPick(magazineId, tax, title, summary);
}
