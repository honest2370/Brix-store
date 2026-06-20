import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { fetchAgents } from "../lib/data";
import type { Profile } from "../lib/types";
import { Input, Spinner, PageHeader, Card, Badge } from "../components/ui";
import Icon from "../components/Icon";

export default function AgentSearch() {
  const { navigate } = useRouter();
  const [q, setQ] = useState("");
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAgents(q || undefined);
    setAgents(data as Profile[]);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Find an Agent" icon={<Icon name="agent" size={22} />} onBack={() => navigate("/profile")} />

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search by Agent ID, username, or name"
          className="flex-1"
        />
        <button onClick={load} className="flex items-center justify-center rounded-xl bg-teal-500/20 px-4 text-teal-400">
          <Icon name="search" size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : agents.length === 0 ? (
        <p className="py-10 text-center text-[#8b949e]">No agents found.</p>
      ) : (
        <div className="space-y-2">
          {agents.map((a) => (
            <Link key={a.id} to={`/agent-profile/${a.agent_id}`}>
              <Card className="flex items-center gap-3 p-3">
                {a.avatar_url ? (
                  <img src={a.avatar_url} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-bold text-white">
                    {(a.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-bold text-[#e6edf3]">{a.full_name || `@${a.username}`}</p>
                    <Badge color="teal">Lvl {a.agent_level || 1}</Badge>
                  </div>
                  <p className="truncate text-xs text-[#8b949e]">Agent ID: {a.agent_id}</p>
                </div>
                <Icon name="chevron" size={16} className="text-[#8b949e]" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
