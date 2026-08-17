import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, or, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { dmConversation, dmMessage, dmKeyShare, user } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/dm/conversations — list conversations the current user participates in
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows: any[] = await db
    .select({
      id: dmConversation.id,
      participantA: dmConversation.participantA,
      participantB: dmConversation.participantB,
      participantAPubkey: dmConversation.participantAPubkey,
      participantBPubkey: dmConversation.participantBPubkey,
      participantADisplayNameEnc: dmConversation.participantADisplayNameEnc,
      participantBDisplayNameEnc: dmConversation.participantBDisplayNameEnc,
      aNonce: dmConversation.aNonce,
      bNonce: dmConversation.bNonce,
      lastMessageAt: dmConversation.lastMessageAt,
      createdAt: dmConversation.createdAt,
      // Join with user to get the other participant's info
      otherUserId: user.id,
      otherUserName: user.name,
      otherUserEmail: user.email,
      otherUserImage: user.image,
    })
    .from(dmConversation)
    .leftJoin(
      user,
      or(
        and(
          eq(dmConversation.participantA, uid),
          eq(user.id, dmConversation.participantB)
        ),
        and(
          eq(dmConversation.participantB, uid),
          eq(user.id, dmConversation.participantA)
        )
      )
    )
    .where(
      or(eq(dmConversation.participantA, uid), eq(dmConversation.participantB, uid))
    )
    .orderBy(desc(dmConversation.lastMessageAt));

  // Map to a cleaner shape
  const conversations = rows.map((r) => {
    const isA = r.participantA === uid;
    const encryptedDisplayName = isA ? r.participantBDisplayNameEnc : r.participantADisplayNameEnc;
    const nonce = isA ? r.bNonce : r.aNonce;
    const peerPubkey = isA ? r.participantBPubkey : r.participantAPubkey;
    return {
      id: r.id,
      participantA: r.participantA,
      participantB: r.participantB,
      peerUserId: r.otherUserId,
      peerUserName: r.otherUserName,
      peerUserEmail: r.otherUserEmail,
      peerUserImage: r.otherUserImage,
      peerPubkey,
      encryptedDisplayName,
      nonce,
      lastMessageAt: r.lastMessageAt,
      createdAt: r.createdAt,
    };
  });

  return Response.json({ conversations });
}

// POST /api/dm/conversations — create a new conversation + first message
// Body: { recipientId, firstCiphertext, firstIv, firstEphemeralPubkey,
//         participantADisplayEnc, participantBDisplayEnc, aNonce, bNonce }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  const { recipientId, firstCiphertext, firstIv, firstEphemeralPubkey } = body;
  const participantADisplayEnc = body.participantADisplayEnc || null;
  const participantBDisplayEnc = body.participantBDisplayEnc || null;
  const aNonce = body.aNonce || null;
  const bNonce = body.bNonce || null;

  if (!recipientId || !firstCiphertext || !firstIv || !firstEphemeralPubkey) {
    return Response.json({ error: "Missing required fields: recipientId, firstCiphertext, firstIv, firstEphemeralPubkey" }, { status: 400 });
  }

  if (recipientId === uid) {
    return Response.json({ error: "Cannot start a conversation with yourself" }, { status: 400 });
  }

  // Determine participant order (lower id first for canonical ordering)
  const [participantA, participantB] = [uid, recipientId].sort();
  const isCurrentUserA = participantA === uid;

  // Check if conversation already exists
  const [existing] = await db
    .select({ id: dmConversation.id })
    .from(dmConversation)
    .where(
      and(
        eq(dmConversation.participantA, participantA),
        eq(dmConversation.participantB, participantB)
      )
    )
    .limit(1);

  if (existing) {
    // Conversation exists — append message to it
    const msgId = randomUUID();
    const now = new Date();
    await db.insert(dmMessage).values({
      id: msgId,
      conversationId: existing.id,
      senderId: uid,
      ciphertext: firstCiphertext,
      iv: firstIv,
      ephemeralPubkey: firstEphemeralPubkey,
      createdAt: now,
    });
    await db
      .update(dmConversation)
      .set({ lastMessageAt: now })
      .where(eq(dmConversation.id, existing.id));

    return Response.json({ conversation: { id: existing.id }, messageId: msgId }, { status: 201 });
  }

  // Fetch the current user's public key to share
  const [myKey] = await db
    .select({ publicKeyPem: dmKeyShare.publicKeyPem })
    .from(dmKeyShare)
    .where(eq(dmKeyShare.userId, uid))
    .limit(1);

  // Fetch recipient's public key
  const [theirKey] = await db
    .select({ publicKeyPem: dmKeyShare.publicKeyPem })
    .from(dmKeyShare)
    .where(eq(dmKeyShare.userId, recipientId))
    .limit(1);

  const conversationId = randomUUID();
  const now = new Date();

  // Create conversation
  await db.insert(dmConversation).values({
    id: conversationId,
    participantA,
    participantB,
    participantAPubkey: isCurrentUserA ? (myKey?.publicKeyPem || null) : (theirKey?.publicKeyPem || null),
    participantBPubkey: isCurrentUserA ? (theirKey?.publicKeyPem || null) : (myKey?.publicKeyPem || null),
    participantADisplayNameEnc: isCurrentUserA ? participantADisplayEnc : participantBDisplayEnc,
    participantBDisplayNameEnc: isCurrentUserA ? participantBDisplayEnc : participantADisplayEnc,
    aNonce: isCurrentUserA ? aNonce : bNonce,
    bNonce: isCurrentUserA ? bNonce : aNonce,
    lastMessageAt: now,
    createdAt: now,
  });

  // Create first message
  const msgId = randomUUID();
  await db.insert(dmMessage).values({
    id: msgId,
    conversationId,
    senderId: uid,
    ciphertext: firstCiphertext,
    iv: firstIv,
    ephemeralPubkey: firstEphemeralPubkey,
    createdAt: now,
  });

  return Response.json({ conversation: { id: conversationId }, messageId: msgId }, { status: 201 });
}