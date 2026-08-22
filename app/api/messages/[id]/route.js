import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { id } = await params;
  const conv = await db.findOne("conversations", { id });
  if (!conv) return fail("Conversation not found", 404);

  const messages = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages || [];

  return ok({
    id: conv.id,
    clientId: conv.client_id || conv.clientId,
    clientName: conv.client_name || conv.clientName,
    lastMessage: conv.last_message || conv.lastMessage,
    lastAt: conv.last_at || conv.lastAt,
    unread: conv.unread || 0,
    messages,
  });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const conv = await db.findOne("conversations", { id });
  if (!conv) return fail("Conversation not found", 404);

  const messages = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages || [];
  messages.forEach((m) => {
    m.read = true;
  });

  const updated = await db.update("conversations", { id }, { unread: 0, messages });
  return ok(updated);
}
