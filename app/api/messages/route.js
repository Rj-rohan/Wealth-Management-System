import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").toLowerCase().trim();

  // 1. Fetch all clients
  const allClients = await db.findMany("clients");

  // 2. Fetch existing conversations
  let rows = await db.findMany("conversations");

  // 3. Auto-populate conversations for clients missing from conversations table
  for (const cl of allClients) {
    const existing = rows.find((r) => r.client_id === cl.id || r.id === `conv_${cl.id}`);
    if (!existing) {
      const now = new Date();
      let initMessages = [];
      let lastMsg = "Hi, let me know when you are free to discuss your wealth goals.";
      if (cl.id === "c_amit_shah" || cl.name?.includes("Amit")) {
        initMessages = [
          { id: "msg_as_1", from: "client", text: "Hello Rahul sir! Wanted to discuss my early retirement portfolio allocation.", at: new Date(now - 3600000 * 3).toISOString(), read: true },
          { id: "msg_as_2", from: "advisor", text: "Hi Amit! I have reviewed your portfolio. With your aggressive risk profile (score 82), we can deploy higher equity compounding for retirement and property goals.", at: new Date(now - 3600000 * 2).toISOString(), read: true },
          { id: "msg_as_3", from: "client", text: "Great! I saw the personalized advice on the portal, looks very comprehensive.", at: new Date(now - 1800000).toISOString(), read: false },
        ];
        lastMsg = initMessages[2].text;
      } else if (cl.id === "c_rahul_kulkarni" || cl.name?.includes("Kulkarni")) {
        initMessages = [
          { id: "msg_rk_1", from: "client", text: "Hi Rahul, should I start a new SIP for the house purchase goal?", at: new Date(now - 86400000).toISOString(), read: true },
          { id: "msg_rk_2", from: "advisor", text: "Hello Rahul! Before scaling the house fund, let's first top up your 6-month emergency buffer (₹3.3L) to protect your liquidity.", at: new Date(now - 43200000).toISOString(), read: true },
          { id: "msg_rk_3", from: "client", text: "Understood, I will allocate ₹12,000 monthly toward the liquid fund as advised.", at: new Date(now - 3600000).toISOString(), read: false },
        ];
        lastMsg = initMessages[2].text;
      } else if (cl.id === "c_priya_patil" || cl.name?.includes("Priya")) {
        initMessages = [
          { id: "msg_pp_1", from: "client", text: "Good morning Rahul. Is it better to prepay my home loan principal or invest in mutual funds this year?", at: new Date(now - 7200000).toISOString(), read: true },
          { id: "msg_pp_2", from: "advisor", text: "Good morning Priya! Given the 40% debt ratio, accelerating principal prepayment by ₹30k/month will save substantial interest while funding the education goal.", at: new Date(now - 3600000).toISOString(), read: true },
          { id: "msg_pp_3", from: "client", text: "Thank you for the clear direction! I will set up the auto-prepayment.", at: new Date(now - 900000).toISOString(), read: true },
        ];
        lastMsg = initMessages[2].text;
      }

      const inserted = await db.insert("conversations", {
        id: `conv_${cl.id}`,
        client_id: cl.id,
        client_name: cl.name,
        last_message: lastMsg,
        last_at: new Date().toISOString(),
        unread: initMessages.filter((m) => m.from === "client" && !m.read).length,
        messages: initMessages,
      });
      rows.push(inserted);
    }
  }

  rows.sort((a, b) => new Date(b.last_at || b.lastAt || 0) - new Date(a.last_at || a.lastAt || 0));

  if (search) {
    rows = rows.filter(
      (c) =>
        (c.client_name || c.clientName || "").toLowerCase().includes(search) ||
        (c.last_message || c.lastMessage || "").toLowerCase().includes(search)
    );
  }

  const result = rows.map((c) => ({
    id: c.id,
    clientId: c.client_id || c.clientId,
    clientName: c.client_name || c.clientName,
    lastMessage: c.last_message || c.lastMessage,
    lastAt: c.last_at || c.lastAt,
    unread: c.unread || 0,
  }));

  return ok(result);
}
