import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { ilike, or, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/dm/search-users?q=... — search users by name/email (excludes current user)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q || q.length < 2) {
    return Response.json({ users: [] });
  }

  const pattern = `%${q}%`;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(
      and(
        ne(user.id, uid),
        or(ilike(user.name, pattern), ilike(user.email, pattern))
      )
    )
    .limit(20);

  return Response.json({ users: rows });
}