import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";
import { randomUUID } from "node:crypto";

export async function POST(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const { text } = body;
  if (!text) return fail("Message text is required");

  const conv = await db.findOne("conversations", { id });
  if (!conv) return fail("Conversation not found", 404);

  const messages = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages || [];
  const message = {
    id: `msg_${randomUUID().slice(0, 8)}`,
    from: "advisor",
    text,
    at: new Date().toISOString(),
    read: true,
  };

  messages.push(message);

  await db.update(
    "conversations",
    { id },
    {
      messages,
      last_message: text,
      last_at: message.at,
    }
  );

  return ok(message);
}
