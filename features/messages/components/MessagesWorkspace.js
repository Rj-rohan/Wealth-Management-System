"use client";
import { useState, useEffect, useCallback } from "react";
import { messagesService } from "@/services/messages.service";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";

export default function MessagesWorkspace() {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [active, setActive] = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  const loadList = useCallback(async (q = "") => {
    setLoadingList(true);
    const list = await messagesService.conversations({ search: q });
    setConversations(list);
    setLoadingList(false);
    return list;
  }, []);

  useEffect(() => {
    loadList().then((list) => {
      if (list.length && !activeId) selectConversation(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadList(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function selectConversation(id) {
    setActiveId(id);
    const conv = await messagesService.getConversation(id);
    setActive(conv);
    await messagesService.markRead(id);
    loadList(search);
  }

  async function handleUpdated() {
    const conv = await messagesService.getConversation(activeId);
    setActive(conv);
    loadList(search);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden grid"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        gridTemplateColumns: "minmax(240px, 320px) 1fr",
        height: "calc(100vh - 160px)",
      }}
    >
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        search={search}
        onSearch={setSearch}
        loading={loadingList}
      />
      <ChatWindow conversation={active} onUpdated={handleUpdated} />
    </div>
  );
}
