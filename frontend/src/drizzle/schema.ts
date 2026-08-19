import { pgTable, text, timestamp, integer, boolean, jsonb, primaryKey, AnyPgColumn } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// better-auth core tables (users, sessions, accounts, verifications) — DO NOT REMOVE
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  tier: text("tier").notNull().default("free"), // content access: guest|free|plus|member
  status: text("status").notNull().default("active"), // active|disabled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Passkey (WebAuthn) credentials table (better-auth passkey plugin)
export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_id").notNull().unique(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull().default(false),
  transports: jsonb("transports"),
  aaguid: text("aaguid"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// AI News Nexus content tables (intake pipeline + rendering + pins)
// ---------------------------------------------------------------------------

// Magazines — a stream/brand on the site (Tech Pulse, WWN, Climate Watch, ...)
export const magazine = pgTable("magazine", {
  id: text("id").primaryKey(), // slug, e.g. "tech-pulse"
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  tone: text("tone").notNull().default("neutral"),
  colors: jsonb("colors"),
  // per-magazine named AI agent (writes on-site commentary for this magazine)
  agentName: text("agent_name"),
  agentModel: text("agent_model").notNull().default("deepseek/deepseek-v4-flash-0731"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Categories / subcategories within a magazine
export const category = pgTable("category", {
  id: text("id").primaryKey(),
  magazineId: text("magazine_id")
    .notNull()
    .references(() => magazine.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

// Sources — DB-backed RSS/Reddit feeds per magazine, editable in the admin UI.
// The engine reads these during discovery so admin-added feeds get pulled.
export const source = pgTable("source", {
  id: text("id").primaryKey(),
  magazineId: text("magazine_id")
    .references(() => magazine.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("rss"),
  url: text("url").notNull(),
  name: text("name"),
  sort: text("sort").default("hot"),
  limit: integer("limit").notNull().default(25),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // tuning / health (added for troublesome-source tracking)
  status: text("status").notNull().default("active"), // active | paused | deleted
  tune: integer("tune").notNull().default(0),         // -3..+3 priority tuning
  deleteCount: integer("delete_count").notNull().default(0),
  moveCount: integer("move_count").notNull().default(0),
  lastDeleteAt: timestamp("last_delete_at"),
});

// Why a post was removed — drives troublesome-source stats & tuning.
export const deletionLog = pgTable("deletion_log", {
  id: text("id").primaryKey(),
  articleId: text("article_id"),
  title: text("title"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  magazineId: text("magazine_id").references(() => magazine.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Each admin move (from_magazine -> to_magazine) — used to learn the right home magazine.
export const magazineMoveLog = pgTable("magazine_move_log", {
  id: text("id").primaryKey(),
  articleId: text("article_id"),
  title: text("title"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  fromMagazineId: text("from_magazine_id").references(() => magazine.id, { onDelete: "set null" }),
  toMagazineId: text("to_magazine_id").references(() => magazine.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Articles — the core content entity, shared by all 3 ingress points.
// Lifecycle: draft -> approved (review queue) -> live. Rejected if unsuitable.
// Ingress source: autonomous / admin-link / collector.
export const article = pgTable("article", {
  id: text("id").primaryKey(),
  ingress: text("ingress").notNull(), // "autonomous" | "admin-link" | "collector"
  sourceUrl: text("source_url"),       // original link (evidence)
  sourceName: text("source_name"),     // clean publisher name, e.g. "TechCrunch" (from Google News source.href)
  imageUrl: text("image_url"),         // og:image hero capture
  title: text("title").notNull(),
  headline: text("headline"),          // admin-optional custom header for pinned/FLASH
  status: text("status").notNull().default("draft"), // draft | approved | live | rejected
  magazineId: text("magazine_id").references(() => magazine.id, { onDelete: "set null" }),
  // supporting AI analysis
  summary: text("summary"),
  commentary: text("commentary"),
  aiThoughts: text("ai_thoughts"),
  warnings: jsonb("warnings"),          // [{level, message}] suitability warnings
  flagged: boolean("flagged").notNull().default(false), // admin attention needed
  suitabilityOk: boolean("suitability_ok").notNull().default(false),
  multiMagazines: jsonb("multi_magazines"), // optional extra magazine ids
  subcategory: text("subcategory"),        // optional category name/slug admin chose
  submittedBy: text("submitted_by").references(() => user.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  publishedAt: timestamp("published_at"),
  socialRepeat: boolean("social_repeat").notNull().default(false), // flag to recycle on social
  socialPostedAt: timestamp("social_posted_at"),
  featured: boolean("featured").notNull().default(false), // admin-controlled flagship slot
  efx: text("efx"),          // optional cinematic CSS effect: 'vhs' | 'rain' | 'lightning' | null
  searchVector: text("search_vector"),          // full-text search index (auto-updated by trigger)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pins — FLASH / IMPORTANT hero placements above date-ordered feed.
export const pin = pgTable("pin", {
  id: text("id").primaryKey(),
  articleId: text("article_id")
    .notNull()
    .references(() => article.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // "FLASH" | "IMPORTANT" | other
  runFor: text("run_for"),       // "24h" | "7d" | "" ("" = until unpinned)
  expiresAt: timestamp("expires_at"), // null = until unpinned
  pinnedAt: timestamp("pinned_at").notNull().defaultNow(),
  unpinnedAt: timestamp("unpinned_at"),
  active: boolean("active").notNull().default(true),
});

// Comments — X/Twitter-style threads on articles (replies via parent_id self-FK).
export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  articleId: text("article_id")
    .notNull()
    .references(() => article.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnyPgColumn => comment.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  deleted: boolean("deleted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products — SWAG / marketplace catalog (catboy mugs, sweatshirts, digital goods)
export const product = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  priceCents: integer("price_cents").notNull().default(0),
  salePriceCents: integer("sale_price_cents"),
  imageUrl: text("image_url"),
  category: text("category").notNull().default("swag"),
  tags: jsonb("tags"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Social publishing accounts — admin-entered, stored for auto-publish (X, Bluesky, LinkedIn...).
export const socialAccount = pgTable("social_account", {
  id: text("id").primaryKey(),
  platform: text("platform").notNull(),
  handle: text("handle"),
  displayName: text("display_name"),
  enabled: boolean("enabled").notNull().default(false),
  utmSource: text("utm_source"),
  accountJson: text("account_json").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SocialAccountRow = typeof socialAccount.$inferSelect;

export type CommentRow = typeof comment.$inferSelect;

export type User = typeof user.$inferSelect;
export type Article = typeof article.$inferSelect;
export type Pin = typeof pin.$inferSelect;
export type MagazineRow = typeof magazine.$inferSelect;
export type CategoryRow = typeof category.$inferSelect;
export type ProductRow = typeof product.$inferSelect;
export type SourceRow = typeof source.$inferSelect;
// Taxonomy table — per-magazine keyword/subcategory definitions
// Replaces hardcoded Python keyword lists in subcategory.py
export const taxonomy = pgTable("taxonomy", {
  id: text("id").primaryKey(),
  magazineId: text("magazine_id")
    .notNull()
    .references(() => magazine.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  subcategory: text("subcategory"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Taxonomy = typeof taxonomy.$inferSelect;
export type NewTaxonomy = typeof taxonomy.$inferInsert;
// ────────────────────────────────────────────
// DM tables — E2EE Direct Messages
// ────────────────────────────────────────────
export const dmConversation = pgTable("dm_conversation", {
  id: text("id").primaryKey(),
  participantA: text("participant_a")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  participantB: text("participant_b")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  participantAPubkey: text("participant_a_pubkey"),
  participantBPubkey: text("participant_b_pubkey"),
  participantADisplayNameEnc: text("participant_a_display_name_enc"),
  participantBDisplayNameEnc: text("participant_b_display_name_enc"),
  aNonce: text("a_nonce"),
  bNonce: text("b_nonce"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dmMessage = pgTable("dm_message", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => dmConversation.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  ephemeralPubkey: text("ephemeral_pubkey").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dmKeyShare = pgTable("dm_key_share", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  publicKeyPem: text("public_key_pem").notNull(),
  keyCreatedAt: timestamp("key_created_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DmConversation = typeof dmConversation.$inferSelect;
export type NewDmConversation = typeof dmConversation.$inferInsert;
export type DmMessage = typeof dmMessage.$inferSelect;
export type NewDmMessage = typeof dmMessage.$inferInsert;
export type DmKeyShare = typeof dmKeyShare.$inferSelect;
export type NewDmKeyShare = typeof dmKeyShare.$inferInsert;
