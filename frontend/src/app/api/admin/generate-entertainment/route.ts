import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const ADMIN_ROLES = ["superadmin", "admin"];
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const FALLBACK_MODEL = "deepseek/deepseek-v4-flash-0731";
const DEFAULT_WWN_ID = "weekly-weird-news";

async function guard(): Promise<Response | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    if (!ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  return null;
}

// POST /api/admin/generate-entertainment
// Generates a CATBOY-style WWN entertainment (satirical/creative) article
// using the magazine's AI agent and stores as a draft.
// body: { magazineId?: string, topic?: string }
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY is not set in the frontend container" }, { status: 500 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const magId = body.magazineId || DEFAULT_WWN_ID;
  const userTopic = (body.topic || "").trim();

  // Load the magazine (agent identity + tone)
  const [mag] = await db.select().from(magazine).where(eq(magazine.id, magId));
  if (!mag) return Response.json({ error: `Magazine "${magId}" not found` }, { status: 404 });

  const agentName = mag.agentName || "Max the Cryptid Reporter";
  const agentModel = mag.agentModel || FALLBACK_MODEL;
  const magName = mag.name || "Weekly Weird News";
  const magTone = mag.tone || "satirical";
  const magTagline = mag.tagline || "The news that didn't happen, reported as if it should have.";

  // Build the system prompt for CATBOY-style article generation
  const systemPrompt = [
    `You are ${agentName}, the celebrated AI journalist for "${magName}".`,
    magTagline ? `Tagline: ${magTagline}` : "",
    `You write SATIRICAL / ENTERTAINMENT articles in a ${magTone} voice — deeply absurd, brilliantly exaggerated, with a wink to the reader.`,
    `Think: CATBOY sightings, cryptid political campaigns, AI love triangles, interdimensional real estate, sentient household appliances.`,
    `Each article must feel like a real news story that clearly didn't happen. Use specific fake details (dates, names, quotes, locations) to sell the bit.`,
    ``,
    `You MUST respond in the following JSON format (and ONLY valid JSON — no markdown fences, no extra text):`,
    `{`,
    `  "title": "CATCHY, ALL-CAPS headline (e.g. CATBOY DECLARES CANDIDACY FOR TUSCALOOSA CITY COUNCIL, PROMISES FREE TUNA FOR ALL)",`,
    `  "summary": "A punchy 2-3 sentence lede that sets up the absurd premise like breaking news.",`,
    `  "commentary": "A 3-5 paragraph article with: (1) setup of the scenario with fake expert quotes, (2) the absurd stakes/conflict, (3) a memorable punchline or callback to previous CATBOY lore.",`,
    `  "ai_thoughts": {"key_insight": "The deeper satirical point", "confidence": 0} `,
    `}`,
    ``,
    `Rules:`,
    `- Never invent facts that could be mistaken for real. Make the absurdity obvious.`,
    `- Include one fake expert quote (Dr. [Silly Name], [Silly Title])`,
    `- Reference CATBOY lore (the 7-Eleven Tuscaloosa sighting, Slurpee incident) if writing for CATBOY`,
    `- Keep commentary 200-350 words total.`,
    `- The article must be CLEARLY satirical — no plausible real news.`,
    userTopic ? `\nSuggested topic (incorporate this if it fits): ${userTopic}` : "",
  ].filter(Boolean).join("\n");

  const userPrompt = [
    `Generate a ${magName} entertainment article in the voice of ${agentName}.`,
    userTopic ? `\nTopic hint: ${userTopic}` : "",
    `\nRespond ONLY with valid JSON matching the schema above.`,
  ].filter(Boolean).join("\n");

  // Call OpenRouter
  let resp: Response;
  try {
    resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nexus.osiris2025.com",
        "X-Title": "Anteroom",
      },
      body: JSON.stringify({
        model: agentModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e: any) {
    return Response.json({ error: `OpenRouter request failed: ${e?.message || e}` }, { status: 502 });
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return Response.json({ error: `OpenRouter ${resp.status}: ${text.slice(0, 300)}` }, { status: resp.status });
  }

  let data: any;
  try { data = await resp.json(); } catch {
    return Response.json({ error: "Invalid response from OpenRouter" }, { status: 502 });
  }

  const raw = data?.choices?.[0]?.message?.content?.trim();
  if (!raw) return Response.json({ error: "OpenRouter returned no content" }, { status: 502 });

  // Parse the JSON from the LLM
  let generated: any;
  try {
    generated = JSON.parse(raw);
  } catch {
    return Response.json({ error: "LLM didn't return valid JSON. Try again." }, { status: 502 });
  }

  const title = generated.title || "Untitled CATBOY Chronicle";
  const summary = generated.summary || null;
  const commentary = generated.commentary || null;
  const aiThoughtsRaw = generated.ai_thoughts || {};
  const aiThoughts = JSON.stringify({
    agent: agentName,
    model: agentModel,
    generatedAt: new Date().toISOString(),
    ...aiThoughtsRaw,
  });

  // Create the article as a draft in the magazine
  const id = `entertainment-${crypto.randomBytes(6).toString("hex")}`;

  try {
    const [created] = await db
      .insert(article)
      .values({
        id,
        ingress: "ai-entertainment",
        title,
        summary,
        commentary,
        aiThoughts,
        status: "draft",
        magazineId: magId,
        submittedAt: new Date(),
      })
      .returning();

    return Response.json({
      article: created,
      agent: agentName,
      prompt_used: userTopic || "none (random topic)",
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to create article" }, { status: 500 });
  }
}