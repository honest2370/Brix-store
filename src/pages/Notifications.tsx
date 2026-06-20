import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { timeAgo } from "../lib/data";
import type { AppNotification } from "../lib/types";
import { Spinner } from "../components/ui";

export default function Notifications() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "system" | "personal">("all");

  useEffect(() => { if (!user) { navigate("/auth"); return; } load(); }, [user]);
  async function load() {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").or(`user_id.eq.${user.id},broadcast.eq.true`).order("created_at", { ascending: false });
    setItems((data as AppNotification[]) || []); setLoading(false);
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }
  async function del(id: string) { await supabase.from("notifications").delete().eq("id", id); load(); toast("Deleted", "success"); }
  async function markAll() { await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id); load(); }

  const system = items.filter((n) => n.broadcast);
  const personal = items.filter((n) => !n.broadcast && n.user_id === user?.id);
  const filtered = filter === "system" ? system : filter === "personal" ? personal : items;
  const unread = items.filter((n) => !n.read).length;

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="rounded-lg p-1.5 text-[#8b949e] hover:bg-[#161b22]">←</button>
          <div>
            <h1 className="text-xl font-bold text-[#e6edf3]">Notifications</h1>
            <p className="text-sm text-teal-400 font-semibold">{unread} unread</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAll} className="rounded-lg p-2 text-teal-400 hover:bg-teal-500/10 text-sm font-bold">✓</button>
          <button onClick={() => { items.forEach((n) => del(n.id)); }} className="rounded-lg p-2 text-[#f43f5e] hover:bg-rose-500/10 text-sm font-bold">🗑</button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 py-3 sticky top-0 z-10 bg-[#0d1117]">
        {(["all", "system", "personal"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${filter === f ? "bg-teal-500 text-white" : "bg-[#161b22] text-[#8b949e]"}`}>
            {f} {f === "all" && <span className="ml-1 rounded-full bg-[#f43f5e] px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="py-10 text-center text-[#8b949e]">No notifications</p>}
        {filtered.map((n) => (
          <div key={n.id} className="relative rounded-2xl p-4 transition" style={{ background: "#161b22", border: !n.read ? "1px solid rgba(20,184,166,.25)" : "1px solid #21262d" }}>
            {!n.read && <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
                <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.5 2a7.5 7.5 0 0 1 5.3 12.8l2.7 2.7-1.4 1.4-2.7-2.7A7.5 7.5 0 1 1 9.5 2Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">{n.broadcast ? "System" : "Personal"}</span>
                </div>
                <p className="font-bold text-[#e6edf3] break-words">{n.title}</p>
                <p className="mt-1 text-sm text-[#8b949e] break-words [overflow-wrap:anywhere]">{n.body}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[#8b949e]">{timeAgo(n.created_at)}</span>
                  <button onClick={() => del(n.id)} className="text-xs font-bold text-teal-400 hover:underline">Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
