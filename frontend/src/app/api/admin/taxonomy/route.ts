import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taxonomy } from "@/drizzle/schema";
import { eq, like, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET /api/admin/taxonomy?magazine=neural-hardware&search=ai
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || (session.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const magazineId = searchParams.get("magazine");
  const search = searchParams.get("search");

  try {
    let conditions = [];
    if (magazineId) {
      conditions.push(eq(taxonomy.magazineId, magazineId));
    }
    if (search) {
      conditions.push(like(taxonomy.keyword, `%${search}%`));
    }

    const rows = conditions.length > 0
      ? await db.select().from(taxonomy).where(and(...conditions)).orderBy(taxonomy.keyword)
      : await db.select().from(taxonomy).orderBy(taxonomy.keyword);

    return NextResponse.json({ taxonomy: rows });
  } catch (error) {
    console.error("Error fetching taxonomy:", error);
    return NextResponse.json({ error: "Failed to fetch taxonomy" }, { status: 500 });
  }
}

// POST /api/admin/taxonomy — create a new taxonomy entry
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || (session.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { magazineId, keyword, subcategory } = body;

    if (!magazineId || !keyword) {
      return NextResponse.json({ error: "magazineId and keyword are required" }, { status: 400 });
    }

    const id = `tax_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const [row] = await db
      .insert(taxonomy)
      .values({ id, magazineId, keyword: keyword.toLowerCase().trim(), subcategory: subcategory?.trim() || null })
      .returning();

    return NextResponse.json({ taxonomy: row }, { status: 201 });
  } catch (error) {
    console.error("Error creating taxonomy entry:", error);
    return NextResponse.json({ error: "Failed to create taxonomy entry" }, { status: 500 });
  }
}

// DELETE /api/admin/taxonomy?id=xxx
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || (session.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await db.delete(taxonomy).where(eq(taxonomy.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting taxonomy entry:", error);
    return NextResponse.json({ error: "Failed to delete taxonomy entry" }, { status: 500 });
  }
}