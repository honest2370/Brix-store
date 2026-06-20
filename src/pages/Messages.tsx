import { useEffect, useRef, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { timeAgo } from "../lib/data";
import type { Conversation, Message } from "../lib/types";
import { Spinner, PageHeader, Card, Textarea, Button, Badge } from "../components/ui";
import Icon from "../components/Icon";

// /messages — list of conversations
// /messages/:id — a single thread
export default function Messages({ id }: { id?: string }) {
  if (id) return <Thread conversationId={id} />;
  return <ConversationList />;
}

function ConversationList() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const isAgent = profile?.is_agent && profile?.agent_approved;

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    const col = isAgent ? "agent_id" : "user_id";
    const { data } = await supabase
      .from("conversations")
      .select("*, agent:profiles!conversations_agent_id_fkey(*), user:profiles!conversations_user_id_fkey(*)")
      .eq(col, user.id)
      .order("last_message_at", { ascending: false });
    setConvos((data as Conversation[]) || []);
    setLoading(false);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Messages" icon={<Icon name="send" size={22} />} onBack={() => navigate("/profile")} />

      {convos.length === 0 ? (
        <p className="py-10 text-center text-[#8b949e]">No conversations yet.{!isAgent && " Search for an agent to get started."}</p>
      ) : (
        <div className="space-y-2">
          {convos.map((c) => {
            const other = isAgent ? c.user : c.agent;
            const unread = isAgent ? c.unread_for_agent : c.unread_for_user;
            return (
              <Card key={c.id} onClick={() => navigate(`/messages/${c.id}`)} className="flex cursor-pointer items-center gap-3 p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-bold text-white">
                  {(other?.username || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-bold text-[#e6edf3]">@{other?.username}</p>
                    {!isAgent && <Badge color="teal">Agent</Badge>}
                    {unread && <span className="h-2 w-2 rounded-full bg-teal-400" />}
                  </div>
                  <p className="truncate text-xs text-[#8b949e]">{c.last_message || "No messages yet"}</p>
                </div>
                <p className="flex-shrink-0 text-xs text-[#8b949e]">{c.last_message_at ? timeAgo(c.last_message_at) : ""}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Thread({ conversationId }: { conversationId: string }) {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [convo, setConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAgent = profile?.is_agent && profile?.agent_approved;

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages((m) => [...m, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function load() {
    const { data: c } = await supabase
      .from("conversations")
      .select("*, agent:profiles!conversations_agent_id_fkey(*), user:profiles!conversations_user_id_fkey(*)")
      .eq("id", conversationId)
      .maybeSingle();
    setConvo((c as Conversation) || null);
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    setMessages((msgs as Message[]) || []);
    // mark as read
    if (c) {
      const field = isAgent ? "unread_for_agent" : "unread_for_user";
      await supabase.from("conversations").update({ [field]: false }).eq("id", conversationId);
    }
    setLoading(false);
  }

  async function send() {
    if (!text.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body: text.trim() });
    if (!error) setText("");
    setSending(false);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!convo) return <p className="py-10 text-center text-[#8b949e]">Conversation not found.</p>;

  const other = isAgent ? convo.user : convo.agent;

  return (
    <div className="mx-auto flex max-w-lg flex-col animate-fade" style={{ minHeight: "calc(100vh - 140px)" }}>
      <PageHeader title={`@${other?.username || "User"}`} icon={<Icon name="agent" size={22} />} onBack={() => navigate("/messages")} />

      <div className="flex-1 space-y-2 overflow-y-auto py-3">
        {messages.length === 0 && <p className="py-10 text-center text-[#8b949e]">Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === user!.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-teal-500/20 text-[#e6edf3]" : "bg-[#161b22] text-[#e6edf3]"}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8b949e]">
                  {m.external && <Badge color="slate">Sent externally</Badge>}
                  <span>{timeAgo(m.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 flex items-end gap-2 border-t border-[#21262d] bg-[#0d1117] pt-3">
        <Textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <Button onClick={send} disabled={sending || !text.trim()}><Icon name="send" size={16} /></Button>
      </div>
    </div>
  );
}
