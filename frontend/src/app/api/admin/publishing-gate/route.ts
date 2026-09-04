import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { asc, sql, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine, pipelineSetting, source } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];
const TRUTHY = ["1", "true", "yes", "on"];

// Task-facing API vocabulary -> engine vocabulary persisted to the DB.
// Engine decide_tier(): per-source override honored ONLY when the global kill-switch is ON.
const OVERRIDE_ENG = { on: "live", off: "draft" } as const;

async function getRole(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return (session?.user as any)?.role || "";
  } catch {
    return "";
  }
}

function truthy(v: string | undefined): boolean {
  return TRUTHY.includes((v ?? "0").trim().toLowerCase());
}

async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db
    .select({ key: pipelineSetting.key, value: pipelineSetting.value })
    .from(pipelineSetting);
  const map: Record<string, string> = {};
  for (const r of rows) if (r.key) map[r.key] = r.value ?? "";
  return map;
}

function toNum(v: string | undefined, fallback: string): string {
  return (v ?? fallback).trim();
}
function numToCamel(map: Record<string, string>) {
  return {
    maxDeleteCount: Number(toNum(map["max_delete_count"], "2")),
    maxMoveCount: Number(toNum(map["max_move_count"], "2")),
    minTuneApprove: Number(toNum(map["min_tune_approve"], "-3")),
    minTuneAutopublish: Number(toNum(map["min_tune_autopublish"], "0")),
  };
}

export async function GET() {
  const role = await getRole();
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const settingsMap = await getSettingsMap();
  const killSwitchOn = truthy(settingsMap["auto_publish_enabled"]);
  const thresholds = numToCamel(settingsMap);

  const srcRows = await db
    .select({
      id: source.id,
      name: source.name,
      url: source.url,
      magazineId: source.magazineId,
      magazineName: magazine.name,
      tune: source.tune,
      deleteCount: source.deleteCount,
      moveCount: source.moveCount,
      autoPublish: source.auto_publish, // engine value: live|approved|draft|null
    })
    .from(source)
    .leftJoin(magazine, eq(magazine.id, source.magazineId))
    .orderBy(asc(magazine.name), asc(source.name));

  const perSource = srcRows.map((s) => ({
    id: s.id,
    name: s.name || s.url,
    url: s.url,
    magazineId: s.magazineId,
    magazineName: s.magazineName,
    tune: s.tune,
    deleteCount: s.deleteCount,
    moveCount: s.moveCount,
    // API-facing tri-state: on (live) | off (draft) | null (follow global / any other engine value)
    autoPublishOverride: s.autoPublish === "live" ? "on" : s.autoPublish === "draft" ? "off" : null,
    autoPublishRaw: s.autoPublish, // engine value, for debug/visibility
  }));

  // Per-source live counts in last 24h, keyed by article.sourceName -> source.name.
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
  const liveRows = await db
    .select({ sourceName: article.sourceName, count: sql<string>`count(*)` })
    .from(article)
    .where(sql`${article.status} = 'live' AND ${article.publishedAt} >= ${cutoff}`)
    .groupBy(article.sourceName);

  const countBySourceName: Record<string, number> = {};
  let live24hTotal = 0;
  for (const r of liveRows) {
    const c = Number(r.count);
    if (r.sourceName) countBySourceName[r.sourceName] = c;
    live24hTotal += c;
  }

  const approvedRows = await db
    .select({ count: sql<string>`count(*)` })
    .from(article)
    .where(eq(article.status, "approved"));
  const queuedTotal = Number(approvedRows[0]?.count ?? 0);

  const summary = `${live24hTotal} auto-published last 24h, ${queuedTotal} queued, kill-switch ${killSwitchOn ? "on" : "off"}`;

  return Response.json({
    settings: {
      autoPublishEnabled: killSwitchOn,
      autoPublishUntil: settingsMap["auto_publish_until"] ?? "",
      ...thresholds,
    },
    thresholds,
    perSource,
    digest: {
      last24hLiveTotal: live24hTotal,
      queuedTotal,
      perSource: countBySourceName,
    },
    summary,
  });
}

export async function PATCH(req: NextRequest) {
  const role = await getRole();
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const updates: { key: string; value: string }[] = [];
  const warnings: string[] = [];

  // Kill-switch
  if (body.autoPublishEnabled !== undefined) {
    const on = !!body.autoPublishEnabled;
    updates.push({ key: "auto_publish_enabled", value: on ? "1" : "0" });
  }
  if (body.autoPublishUntil !== undefined) {
    updates.push({ key: "auto_publish_until", value: String(body.autoPublishUntil ?? "") });
  }

  // Thresholds
  const thresholdMap: [string, string][] = [
    ["maxDeleteCount", "max_delete_count"],
    ["maxMoveCount", "max_move_count"],
    ["minTuneApprove", "min_tune_approve"],
    ["minTuneAutopublish", "min_tune_autopublish"],
  ];
  for (const [camel, key] of thresholdMap) {
    if (body[camel] !== undefined) {
      const n = Number(body[camel]);
      if (!Number.isFinite(n)) {
        return Response.json({ error: `${camel} must be a number` }, { status: 400 });
      }
      updates.push({ key, value: String(Math.round(n)) });
    }
  }

  for (const u of updates) {
    await db
      .insert(pipelineSetting)
      .values({ key: u.key, value: u.value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: pipelineSetting.key, set: { value: u.value, updatedAt: new Date() } });
  }

  // Per-source override
  let overrideUpdated: { sourceId: string; engineValue: string | null } | null = null;
  if (body.sourceId !== undefined) {
    const sourceId = String(body.sourceId);
    const ov = body.autoPublishOverride; // on | off | null
    let engineValue: string | null = null;
    if (ov === null || ov === undefined || ov === "follow-global") {
      engineValue = null; // follow global
    } else if (ov === "on") {
      engineValue = OVERRIDE_ENG.on;
    } else if (ov === "off") {
      engineValue = OVERRIDE_ENG.off;
    } else if (typeof ov === "string" && ["live", "approved", "draft"].includes(ov)) {
      engineValue = ov; // engine-native value passthrough
    } else {
      return Response.json({ error: "autoPublishOverride must be on|off|null (follow-global) or engine value live|approved|draft" }, { status: 400 });
    }
    await db.update(source).set({ auto_publish: engineValue }).where(eq(source.id, sourceId));
    overrideUpdated = { sourceId, engineValue };
  } else if (body.autoPublishOverride !== undefined && body.sourceId === undefined) {
    warnings.push("sourceId missing; autoPublishOverride ignored");
  }

  if (updates.length === 0 && !overrideUpdated && warnings.length === 0) {
    return Response.json({ error: "nothing to update" }, { status: 400 });
  }

  const settingsMap = await getSettingsMap();
  return Response.json({
    ok: true,
    applied: { settings: updates, overrideUpdated },
    warnings,
    settings: {
      autoPublishEnabled: truthy(settingsMap["auto_publish_enabled"]),
      autoPublishUntil: settingsMap["auto_publish_until"] ?? "",
      ...numToCamel(settingsMap),
    },
  });
}
