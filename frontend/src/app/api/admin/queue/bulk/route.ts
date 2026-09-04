import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

async function getRole(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return (session?.user as any)?.role || "";
  } catch {
    return "";
  }
}

// Which source statuses each bulk action operates on.
const FROM: Record<string, string[]> = {
  approve: ["draft"],
  publish: ["approved"],
};
const TO: Record<string, string> = { approve: "approved", publish: "live" };

function buildConds(action: string, magazine: string, status: string, q: string) {
  const conds: any[] = [];
  if (magazine && magazine !== "all") conds.push(eq(article.magazineId, magazine));
  // Bulk only ever moves the eligible source status(es) for the action; if the user
  // filtered to one status it must be one of those, otherwise nothing matches.
  const eligible = FROM[action];
  if (status && status !== "all") {
    conds.push(eligible.includes(status) ? eq(article.status, status) : sql`false`);
  } else {
    conds.push(sql`${article.status} = ANY(${eligible})`);
  }
  if (q) conds.push(sql`search_vector @@ plainto_tsquery('english', ${q})`);
  return and(...conds);
}

// GET  /api/admin/queue/bulk?magazine=&status=&q=   → counts of what each action WOULD touch
// POST /api/admin/queue/bulk {action, magazine, status, q} → performs it, returns {updated}
export async function GET(req: NextRequest) {
  if (!ADMIN_ROLES.includes(await getRole())) return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const magazine = sp.get("magazine") || "all";
  const status = sp.get("status") || "all";
  const q = (sp.get("q") || "").trim();
  try {
    const out: Record<string, number> = {};
    for (const action of Object.keys(FROM)) {
      const r = await db.select({ n: sql<number>`count(*)::int` }).from(article).where(buildConds(action, magazine, status, q));
      out[action] = r[0]?.n || 0;
    }
    return Response.json(out);
  } catch (e: any) {
    return Response.json({ error: e?.message || "count failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!ADMIN_ROLES.includes(await getRole())) return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (!FROM[action]) return Response.json({ error: "action must be approve|publish" }, { status: 400 });
    const magazine = String(body.magazine || "all");
    const status = String(body.status || "all");
    const q = String(body.q || "").trim();
    const upd: any = { status: TO[action] };
    if (action === "publish") upd.publishedAt = new Date();
    const rows = await db.update(article).set(upd).where(buildConds(action, magazine, status, q)).returning({ id: article.id });
    return Response.json({ updated: rows.length, action, scope: { magazine, status, q } });
  } catch (e: any) {
    return Response.json({ error: e?.message || "bulk update failed" }, { status: 500 });
  }
}
