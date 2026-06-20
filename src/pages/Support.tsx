import { useEffect, useRef, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { fmtDate, timeAgo } from "../lib/data";
import type { Ticket } from "../lib/types";
import { Button, Input, Textarea, Card, Spinner, Badge, EmptyState, PageHeader } from "../components/ui";
import Icon from "../components/Icon";

export default function Support() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket]);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  }

  async function send() {
    if (!user) return;
    if (!subject || !message) { toast("Fill subject & message", "error"); return; }
    setBusy(true);
    const { error, data } = await supabase
      .from("tickets")
      .insert({ user_id: user.id, subject, message, status: "open" })
      .select()
      .single();
    if (error) { toast(error.message, "error"); setBusy(false); return; }
    toast("Ticket sent! We'll reply soon.", "success");
    setSubject(""); setMessage(""); setBusy(false);
    await load();
    if (data) setActiveTicket(data as Ticket);
  }

  // Open a specific ticket as a full message thread
  if (activeTicket) {
    return (
      <TicketThread
        ticket={activeTicket}
        onBack={() => { setActiveTicket(null); load(); }}
      />
    );
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade">
      <PageHeader
        title="Support"
        subtitle="Get help from the Brixnode team"
        icon={<Icon name="ticket" size={22} />}
        onBack={() => navigate("/profile")}
      />

      {/* New ticket form */}
      <Card className="mt-5 space-y-3 p-5">
        <h3 className="flex items-center gap-2 font-bold text-[#e6edf3]">
          <Icon name="plus" size={16} className="text-teal-400" />
          Open new ticket
        </h3>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
        />
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue..."
        />
        <Button onClick={send} disabled={busy}>
          {busy ? "Sending..." : "Send ticket"}
        </Button>
      </Card>

      {/* Ticket list */}
      <h3 className="mb-3 mt-8 font-bold text-[#e6edf3]">Your tickets</h3>
      {tickets.length === 0 ? (
        <EmptyState
          icon={<Icon name="ticket" size={36} />}
          title="No tickets"
          desc="Your support conversations appear here."
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTicket(t)}
              className="w-full text-left"
            >
              <Card className="p-4 transition hover:border-teal-500/40 hover:bg-[#161b22]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#e6edf3]">{t.subject}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#8b949e]">{t.message}</p>
                    <p className="mt-1 text-xs text-[#8b949e]">{timeAgo(t.created_at)}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <Badge color={t.status === "answered" ? "green" : t.status === "closed" ? "slate" : "amber"}>
                      {t.status}
                    </Badge>
                    {t.reply && (
                      <span className="text-[10px] font-semibold text-teal-400">
                        1 reply
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Full messaging thread view ─── */
function TicketThread({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket>(ticket);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentTicket]);

  async function refreshTicket() {
    const { data } = await supabase.from("tickets").select("*").eq("id", ticket.id).single();
    if (data) setCurrentTicket(data as Ticket);
  }

  async function sendFollowUp() {
    if (!replyText.trim() || !user) return;
    setSending(true);
    // Append to existing message as a follow-up note
    const updatedMessage = currentTicket.message + "\n\n--- Follow-up ---\n" + replyText;
    const { error } = await supabase
      .from("tickets")
      .update({ message: updatedMessage, status: "open" })
      .eq("id", ticket.id);
    if (error) { toast(error.message, "error"); setSending(false); return; }
    setReplyText("");
    setSending(false);
    toast("Message sent", "success");
    await refreshTicket();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendFollowUp();
    }
  }

  const statusColor = currentTicket.status === "answered" ? "green" : currentTicket.status === "closed" ? "slate" : "amber";

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col animate-fade">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#21262d] pb-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3] transition"
        >
          <Icon name="back" size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#e6edf3]">{currentTicket.subject}</p>
          <p className="text-xs text-[#8b949e]">Support · {fmtDate(currentTicket.created_at)}</p>
        </div>
        <Badge color={statusColor}>{currentTicket.status}</Badge>
      </div>

      {/* Message thread — scrollable */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Original message — user bubble */}
        <MessageBubble
          text={currentTicket.message}
          sender="You"
          time={fmtDate(currentTicket.created_at)}
          side="right"
          color="indigo"
        />

        {/* Admin reply — if exists */}
        {currentTicket.reply && (
          <MessageBubble
            text={currentTicket.reply}
            sender="Brixnode Support"
            time=""
            side="left"
            color="teal"
          />
        )}

        {!currentTicket.reply && currentTicket.status === "open" && (
          <div className="flex justify-center">
            <p className="rounded-full bg-[#161b22] px-4 py-1.5 text-xs text-[#8b949e]">
              ⏳ Waiting for support reply...
            </p>
          </div>
        )}

        {currentTicket.status === "closed" && (
          <div className="flex justify-center">
            <p className="rounded-full bg-[#161b22] px-4 py-1.5 text-xs text-[#8b949e]">
              🔒 Ticket closed
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply input — fixed at bottom */}
      {currentTicket.status !== "closed" && (
        <div className="flex-shrink-0 border-t border-[#21262d] pt-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a follow-up message… (Enter to send)"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-[#21262d] bg-[#161b22] px-4 py-3 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30"
            />
            <button
              onClick={sendFollowUp}
              disabled={sending || !replyText.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-teal-500 text-white transition hover:bg-teal-400 disabled:opacity-40"
            >
              {sending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Icon name="send" size={18} />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[#8b949e]">
            Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  text,
  sender,
  time,
  side,
  color,
}: {
  text: string;
  sender: string;
  time: string;
  side: "left" | "right";
  color: "indigo" | "teal";
}) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${side === "right" ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <span className="px-2 text-[10px] font-semibold text-[#8b949e]">
          {sender}{time ? ` · ${time}` : ""}
        </span>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-sm ${
            color === "indigo"
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : "bg-[#161b22] border border-[#21262d] text-[#e6edf3] rounded-tl-sm"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
