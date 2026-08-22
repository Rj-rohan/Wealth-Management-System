import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";
import { randomUUID } from "node:crypto";

export async function POST(request, { params }) {
  const { id } = await params;
  const conv = await db.findOne("conversations", { id });
  if (!conv) return fail("Conversation not found", 404);

  const messages = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages || [];
  const clientName = conv.client_name || "Client";
  const firstName = clientName.split(" ")[0];

  const replies = [
    `Thanks Rahul! I will review the financial plan and update you.`,
    `Got it, thank you for the advice! Should we schedule a quick call this week?`,
    `Understood! I'll proceed with the suggested monthly SIP adjustments.`,
    `Thank you for looking into this, Rahul. Looking forward to our next quarterly review.`,
    `Sounds like a solid strategy. I'll make sure to follow up on the emergency fund allocation.`,
  ];

  const randomReply = replies[Math.floor(Math.random() * replies.length)];

  const replyMessage = {
    id: `msg_${randomUUID().slice(0, 8)}`,
    from: "client",
    text: randomReply,
    at: new Date().toISOString(),
    read: true,
  };

  messages.push(replyMessage);

  await db.update(
    "conversations",
    { id },
    {
      messages,
      last_message: randomReply,
      last_at: replyMessage.at,
    }
  );

  return ok(replyMessage);
}
