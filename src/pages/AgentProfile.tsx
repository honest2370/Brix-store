import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { getOrCreateConversation } from "../lib/data";
import type { Profile, AgentStats } from "../lib/types";
import { Spinner, PageHeader, Card, Badge, Button } from "../components/ui";
import Icon, { type IconName } from "../components/Icon";

const CONTACT_ICONS: { key: string; icon: IconName; label: string }[] = [
  { key: "whatsapp", icon: "whatsapp", label: "WhatsApp" },
  { key: "telegram", icon: "telegram", label: "Telegram" },
  { key: "email", icon: "mail", label: "Email" },
];

export default function AgentProfile({ agentId }: { agentId: string }) {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [agent, setAgent] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, [agentId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("agent_id", agentId)
      .eq("is_agent", true)
      .eq("agent_approved", true)
      .maybeSingle();
    setAgent((data as Profile) || null);
    if (data) {
      const { data: s } = await supabase.from("agent_stats").select("*").eq("agent_id", data.id).maybeSingle();
      setStats((s as AgentStats) || null);
    }
    setLoading(false);
  }

  async function startConversation() {
    if (!user) { navigate("/auth"); return; }
    if (!agent) return;
    setBusy(true);
    try {
      const conv = await getOrCreateConversation(agent.id, user.id);
      navigate(`/messages/${conv.id}`);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!agent) return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Agent" icon={<Icon name="agent" size={22} />} onBack={() => navigate("/agents")} />
      <p className="py-10 text-center text-[#8b949e]">Agent not found.</p>
    </div>
  );

  const contacts = agent.agent_contacts || {};
  const activeContacts = CONTACT_ICONS.filter((c) => contacts[c.key]);

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Agent Profile" icon={<Icon name="agent" size={22} />} onBack={() => navigate("/agents")} />

      <Card className="flex flex-col items-center p-5 text-center">
        {agent.avatar_url ? (
          <img src={agent.avatar_url} className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-500" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500">
            <Icon name="user" size={34} className="text-white" />
          </div>
        )}
        <h2 className="mt-3 text-xl font-bold text-[#e6edf3]">{agent.full_name || `@${agent.username}`}</h2>
        <p className="text-sm text-[#8b949e]">@{agent.username}</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge color="teal">Level {agent.agent_level || 1}</Badge>
          <Badge color="green">Verified Agent</Badge>
        </div>
        <div className="mt-2 rounded-xl bg-[#0d1117] px-3 py-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">Agent ID</p>
          <p className="font-mono text-sm text-[#e6edf3]">{agent.agent_id}</p>
        </div>
        {agent.agent_bio && <p className="mt-3 text-sm text-[#8b949e]">{agent.agent_bio}</p>}
      </Card>

      {/* Performance */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Users Helped" value={String(stats?.users_helped || 0)} />
        <Stat label="Issues Resolved" value={String(stats?.issues_resolved || 0)} />
        <Stat label="Rating" value={stats?.rating_count ? `${(stats?.rating || 0).toFixed(1)}★` : "—"} />
      </div>

      {/* Contact */}
      <Card className="space-y-3 p-4">
        <h3 className="font-bold text-[#e6edf3]">Contact this agent</h3>
        <Button className="w-full" onClick={startConversation} disabled={busy}>
          <Icon name="send" size={16} /> {busy ? "Opening..." : "Message in-app"}
        </Button>
        {activeContacts.length > 0 && (
          <>
            <p className="text-xs text-[#8b949e]">Or reach out externally:</p>
            <div className="flex gap-2">
              {activeContacts.map((c) => (
                <a
                  key={c.key}
                  href={externalLink(c.key, contacts[c.key])}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d1117] py-2.5 text-sm font-semibold text-[#e6edf3]"
                >
                  <Icon name={c.icon} size={16} className="text-teal-400" /> {c.label}
                </a>
              ))}
            </div>
          </>
        )}
        <p className="text-xs text-[#8b949e]">
          Agents reply both in-app and externally — your conversation history stays visible here either way.
        </p>
      </Card>
    </div>
  );
}

function externalLink(key: string, value: string) {
  if (key === "whatsapp") return `https://wa.me/${value.replace(/[^0-9]/g, "")}`;
  if (key === "telegram") return `https://t.me/${value.replace(/^@/, "")}`;
  if (key === "email") return `mailto:${value}`;
  return value;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-3 text-center">
      <p className="text-lg font-black text-teal-400">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">{label}</p>
    </div>
  );
}
