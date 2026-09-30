import { db } from "@/lib/db";
import { article, socialAccount } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { SITE_URL } from "@/lib/site";

export function buildTweetText({
  title,
  summary,
  id,
  utmSource,
}: {
  title: string;
  summary: string | null;
  id: string;
  utmSource: string | null;
}): string {
  const baseUrl = `${SITE_URL}/articles/${id}`;
  const utm = `?utm_source=${utmSource || "x"}&utm_medium=social&utm_campaign=auto-publish`;

  let text = `${title}\n\n`;
  if (summary) {
    const trunc =
      summary.length > 220
        ? summary.slice(0, 219).trim() + "\u2026"
        : summary;
    text += `${trunc}\n\n`;
  }
  text += `${baseUrl}${utm}`;

  if (text.length > 280) {
    text = `${title}\n\n${baseUrl}${utm}`;
  }
  if (text.length > 280) {
    const shortTitle = title.length > 250 ? title.slice(0, 247).trim() + "\u2026" : title;
    text = `${shortTitle}\n\n${baseUrl}${utm}`;
  }

  return text;
}

export async function postToX(text: string): Promise<string> {
  const API_KEY = process.env.TWITTER_APIKEY ?? null;
  const API_KEY_SECRET = process.env.TWITTER_APIKEY_SECRET ?? null;
  const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN ?? null;
  const ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET ?? null;

  if (!API_KEY || !API_KEY_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
    throw new Error("Twitter API keys not configured.");
  }

  try {
    const { TwitterApi } = await import("twitter-api-v2");
    const client = new TwitterApi({
      appKey: API_KEY,
      appSecret: API_KEY_SECRET,
      accessToken: ACCESS_TOKEN,
      accessSecret: ACCESS_TOKEN_SECRET,
    });
    const result = await client.v2.tweet(text);
    const tweetId = result.data.id;
    return `https://twitter.com/user/status/${tweetId}`;
  } catch (error: any) {
    throw new Error(`Twitter post failed: ${error?.message || String(error)}`);
  }
}

export async function publishArticleToX(articleId: string): Promise<string> {
  const [row] = await db.select().from(article).where(eq(article.id, articleId));
  if (!row) throw new Error("Article not found");

  const [account] = await db
    .select()
    .from(socialAccount)
    .where(and(eq(socialAccount.platform, "x"), eq(socialAccount.enabled, true)))
    .limit(1);

  const utmSource = account?.utmSource || "x";

  if (process.env.TWITTER_APIKEY) {
    const text = buildTweetText({
      title: row.title,
      summary: row.summary,
      id: row.id,
      utmSource,
    });
    return await postToX(text);
  } else if (account) {
    try {
      const creds = JSON.parse(account.accountJson || "{}");
      if (creds.token) {
        const text = buildTweetText({
          title: row.title,
          summary: row.summary,
          id: row.id,
          utmSource,
        });
        return `Prepared tweet: ${text}`;
      }
    } catch {
      /* ignore */
    }
  }

  throw new Error("No Twitter API keys configured.");
}
