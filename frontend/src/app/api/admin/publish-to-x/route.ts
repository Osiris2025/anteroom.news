import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { publishArticleToX } from "@/lib/twitter";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

export async function POST(req: NextRequest) {
  let session = null;
  try { session = await auth.api.getSession({ headers: await headers() }); } catch {}
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden - admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const articleId = body.articleId;
  if (!articleId) {
    return Response.json({ error: "articleId required" }, { status: 400 });
  }

  try {
    const postUrl = await publishArticleToX(articleId);
    return Response.json({ ok: true, postUrl });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to post to X" }, { status: 500 });
  }
}
