import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Split commentary into X-thread posts.
 * Each post ≤280 chars for optimal X display.
 * Uses sentence + paragraph boundaries for clean splits.
 */
function splitIntoPosts(text: string): string[] {
  // Strip markdown formatting for plain text
  let clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1")     // italic
    .replace(/__([^_]+)__/g, "$1")  // underline
    .replace(/#{1,6}\s+/g, "")      // headers
    .replace(/`([^`]+)`/g, "$1")    // inline code
    .replace(/---+/, "")            // hr
    .trim();

  // Split on paragraph breaks
  const paragraphs = clean.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const posts: string[] = [];
  const MAX_LEN = 280;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length === 0) continue;

    if (trimmed.length <= MAX_LEN) {
      posts.push(trimmed);
    } else {
      // Split long paragraphs on sentence boundaries
      const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [trimmed];
      let current = "";
      for (const sentence of sentences) {
        const candidate = current ? current + " " + sentence.trim() : sentence.trim();
        if (candidate.length <= MAX_LEN) {
          current = candidate;
        } else {
          if (current) posts.push(current);
          if (sentence.trim().length > MAX_LEN) {
            let remaining = sentence.trim();
            while (remaining.length > MAX_LEN) {
              posts.push(remaining.substring(0, MAX_LEN));
              remaining = remaining.substring(MAX_LEN);
            }
            if (remaining.length > 0) current = remaining;
            else current = "";
          } else {
            current = sentence.trim();
          }
        }
      }
      if (current) posts.push(current);
    }
  }

  if (posts.length === 0) posts.push(clean.substring(0, MAX_LEN));
  // Cap at 10 posts for sanity
  return posts.slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");
  if (!articleId) {
    return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
  }

  const rows: any[] = await db
    .select()
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.id, articleId));

  const r = rows[0];
  if (!r || !r.article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const a = r.article;
  const mag = r.magazine;
  const agentName = mag?.agentName || "The Desk";
  const magName = mag?.name || "Anteroom";
  const title = a.headline || a.title || "Untitled";
  const commentary = a.commentary || a.summary || "";

  if (!commentary) {
    return NextResponse.json({ error: "No commentary available for this article" }, { status: 404 });
  }

  const articleUrl = `https://nexus.osiris2025.com/articles/${articleId}`;

  // Split commentary into thread posts
  const contentPosts = splitIntoPosts(commentary);

  // Build the thread with numbered posts
  const thread = contentPosts.map((content, i) => ({
    postNumber: i + 1,
    totalPosts: contentPosts.length,
    content,
    label: `${i + 1}/${contentPosts.length}`,
    charCount: content.length,
  }));

  // Build X share intent URL for the entire thread
  const fullText = thread.map(p => `${p.label} ${p.content}`).join("\n\n");
  const xIntentUrl = `https://x.com/intent/post?text=${encodeURIComponent(fullText)}`;

  // Per-post X URLs
  const perPostXUrls = thread.map(p => ({
    postNumber: p.postNumber,
    url: `https://x.com/intent/post?text=${encodeURIComponent(`${p.label} ${p.content}\n\n${articleUrl}`)}`,
  }));

  return NextResponse.json({
    articleTitle: title,
    magazineName: magName,
    agentName,
    articleUrl,
    thread,
    xIntentUrl,
    perPostXUrls,
    totalPosts: contentPosts.length,
  });
}