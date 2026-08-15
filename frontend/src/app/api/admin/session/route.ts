import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// GET /api/admin/session — public-safe: tells the client whether the current user
// is an admin (used to reveal the inline editorial toolbar on magazine cards).
// NEVER exposes user data. Plain boolean only.
export async function GET(_req: NextRequest) {
  let isAdmin = false;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    isAdmin = role === "admin" || role === "superadmin";
  } catch {
    isAdmin = false;
  }
  return Response.json({ isAdmin });
}