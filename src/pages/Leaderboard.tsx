import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { supabase } from "../lib/supabase";
import type { LeaderboardRow } from "../lib/types";
import { money } from "../lib/data";
import { Spinner, PageHeader, Badge } from "../components/ui";
import Icon from "../components/Icon";

const TABS: { key: "all" | "buyer" | "creator" | "agent"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "buyer", label: "Buyers" },
  { key: "creator", label: "Creators" },
  { key: "agent", label: "Agents" },
];

export default function Leaderboard() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "buyer" | "creator" | "agent">("all");

  useEffect(() => {
    supabase
      .from("leaderboard_view")
      .select("*")
      .order("balance", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRows((data as LeaderboardRow[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const filtered = tab === "all" ? rows : rows.filter((r) => r.category === tab);
  const sorted =
    tab === "agent"
      ? [...filtered].sort((a, b) => (b.agent_issues_resolved + b.agent_users_helped) - (a.agent_issues_resolved + a.agent_users_helped))
      : tab === "creator"
      ? [...filtered].sort((a, b) => b.creator_sales - a.creator_sales)
      : [...filtered].sort((a, b) => (b.balance || 0) - (a.balance || 0));

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Leaderboard" icon={<Icon name="trophy" size={22} />} onBack={() => navigate("/profile")} />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-teal-500/20 text-teal-300" : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.length === 0 && <p className="py-10 text-center text-[#8b949e]">No users yet.</p>}
        {sorted.map((u, i) => (
          <div
            key={u.id}
            onClick={() => u.category === "agent" && navigate(`/agent-profile/${u.agent_id}`)}
            className={`flex items-center gap-3 rounded-xl p-3 ${u.category === "agent" ? "cursor-pointer" : ""}`}
            style={{
              background: i < 3 ? "linear-gradient(135deg, rgba(245,158,11,.15), rgba(20,184,166,.1))" : "#161b22",
              border: i < 3 ? "1px solid rgba(245,158,11,.3)" : "1px solid #21262d",
            }}
          >
            <span className={`flex w-8 justify-center font-black ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-[#8b949e]"}`}>
              {i < 3 ? <Icon name="trophy" size={18} /> : `#${i + 1}`}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-bold text-white">
              {(u.username || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-bold text-[#e6edf3]">@{u.username}</p>
                {u.category === "agent" && <Badge color="teal">Agent</Badge>}
                {u.category === "creator" && <Badge color="slate">Creator</Badge>}
              </div>
              <p className="truncate text-xs text-[#8b949e]">
                {u.category === "agent"
                  ? `${u.agent_users_helped} users · ${u.agent_issues_resolved} resolved`
                  : u.category === "creator"
                  ? `${money(u.creator_sales)} in sales`
                  : u.full_name}
              </p>
            </div>
            <p className="font-black text-teal-400">{u.category === "creator" ? money(u.creator_sales) : money(u.balance || 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
