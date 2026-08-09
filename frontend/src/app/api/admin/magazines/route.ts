import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// GET /api/admin/magazines — list magazines (with a slug availability check helper)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  const rows = await db.select().from(magazine).orderBy(asc(magazine.name));
  return Response.json({ magazines: rows });
}

// POST /api/admin/magazines — create a new magazine
// body: { name, id?, tagline?, description?, colors? }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const name = (body.name || "").trim();
  if (!name) return Response.json({ error: "Magazine name required" }, { status: 400 });

  const id = body.id ? slugify(body.id) : slugify(name);
  if (!id) return Response.json({ error: "Could not build a slug for that name" }, { status: 400 });

  // id collision check
  const existing = await db.select({ id: magazine.id }).from(magazine).where(eq(magazine.id, id));
  if (existing.length) {
    return Response.json({ error: "A magazine with that id already exists", id }, { status: 409 });
  }

  try {
    const [created] = await db.insert(magazine).values({
      id,
      name,
      tagline: body.tagline || null,
      description: body.description || null,
      colors: body.colors || null,
    }).returning();
    return Response.json({ magazine: created });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to create magazine" }, { status: 500 });
  }
}