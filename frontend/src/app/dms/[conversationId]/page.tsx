"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import DmConversation from "@/components/DmConversation";

export default function DmConversationPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <DmConversation conversationId={conversationId} />
      </div>
    </div>
  );
}