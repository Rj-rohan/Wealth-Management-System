import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";
import { randomUUID } from "node:crypto";
import { generateChatResponse } from "@/lib/chat/chatResponder";

export async function POST(request, { params }) {
  const { id } = await params;
  const conv = await db.findOne("conversations", { id });
  if (!conv) return fail("Conversation not found", 404);

  const messages = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages || [];
  
  // Find latest message from advisor
  const lastAdvisorMsg = [...messages].reverse().find((m) => m.from === "advisor") || { text: "" };

  // Generate intent-driven, context-aware reply
  const chatResult = await generateChatResponse({
    clientId: conv.client_id || conv.clientId,
    message: lastAdvisorMsg.text,
    conversationHistory: messages,
  });

  const replyMessage = {
    id: `msg_${randomUUID().slice(0, 8)}`,
    from: "client",
    text: chatResult.text,
    at: new Date().toISOString(),
    read: true,
    intent: chatResult.intent,
  };

  messages.push(replyMessage);

  await db.update(
    "conversations",
    { id },
    {
      messages,
      last_message: replyMessage.text,
      last_at: replyMessage.at,
    }
  );

  return ok(replyMessage);
}

