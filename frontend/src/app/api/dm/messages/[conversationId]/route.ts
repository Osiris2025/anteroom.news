import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, and, or, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { dmConversation, dmMessage, user } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/dm/messages/[conversationId] — returns messages (must be a participant)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;

  // Verify user is a participant
  const [conv] = await db
    .select({ id: dmConversation.id })
    .from(dmConversation)
    .where(
      and(
        eq(dmConversation.id, conversationId),
        or(
          eq(dmConversation.participantA, uid),
          eq(dmConversation.participantB, uid)
        )
      )
    )
    .limit(1);

  if (!conv) {
    return Response.json({ error: "Conversation not found or access denied" }, { status: 404 });
  }

  // Fetch messages with sender info
  const rows: any[] = await db
    .select({
      id: dmMessage.id,
      conversationId: dmMessage.conversationId,
      senderId: dmMessage.senderId,
      ciphertext: dmMessage.ciphertext,
      iv: dmMessage.iv,
      ephemeralPubkey: dmMessage.ephemeralPubkey,
      createdAt: dmMessage.createdAt,
      senderName: user.name,
      senderEmail: user.email,
    })
    .from(dmMessage)
    .leftJoin(user, eq(dmMessage.senderId, user.id))
    .where(eq(dmMessage.conversationId, conversationId))
    .orderBy(asc(dmMessage.createdAt));

  return Response.json({ messages: rows });
}

// POST /api/dm/messages/[conversationId] — append an encrypted message
// Body: { ciphertext, iv, ephemeralPubkey }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;

  // Verify user is a participant
  const [conv] = await db
    .select({ id: dmConversation.id })
    .from(dmConversation)
    .where(
      and(
        eq(dmConversation.id, conversationId),
        or(
          eq(dmConversation.participantA, uid),
          eq(dmConversation.participantB, uid)
        )
      )
    )
    .limit(1);

  if (!conv) {
    return Response.json({ error: "Conversation not found or access denied" }, { status: 404 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { ciphertext, iv, ephemeralPubkey } = body;

  if (!ciphertext || !iv || !ephemeralPubkey) {
    return Response.json({ error: "Missing required fields: ciphertext, iv, ephemeralPubkey" }, { status: 400 });
  }

  const msgId = randomUUID();
  const now = new Date();

  await db.insert(dmMessage).values({
    id: msgId,
    conversationId,
    senderId: uid,
    ciphertext,
    iv,
    ephemeralPubkey,
    createdAt: now,
  });

  // Update conversation's last_message_at
  await db
    .update(dmConversation)
    .set({ lastMessageAt: now })
    .where(eq(dmConversation.id, conversationId));

  return Response.json({ messageId: msgId }, { status: 201 });
}