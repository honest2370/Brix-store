import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { fmtDate } from "../lib/data";
import type { AgentRequest } from "../lib/types";
import { Input, Textarea, Spinner, Badge, Card, PageHeader, Button } from "../components/ui";
import Icon from "../components/Icon";

export default function Agent() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    agent_id: "",
    full_name: "",
    email: "",
    whatsapp: "",
    country: "",
    portfolio: "",
    experience: "",
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  useEffect(() => {
    if (profile) setF((s) => ({
      ...s,
      full_name: s.full_name || profile.full_name || "",
      email: s.email || profile.email || "",
      whatsapp: s.whatsapp || profile.phone || "",
      country: s.country || profile.country || "",
    }));
  }, [profile]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("agent_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRequests((data as AgentRequest[]) || []);
    setLoading(false);
  }

  async function apply() {
    if (!f.agent_id.trim()) { toast("Choose an Agent ID", "error"); return; }
    if (!f.full_name.trim() || (!f.email.trim() && !f.whatsapp.trim())) { toast("Add your name and a contact (email or WhatsApp)", "error"); return; }
    if (!f.portfolio.trim()) { toast("Add your portfolio or experience link", "error"); return; }
    setBusy(true);
    const { error } = await supabase.from("agent_requests").insert({
      user_id: user!.id,
      agent_id: f.agent_id,
      full_name: f.full_name,
      email: f.email,
      whatsapp: f.whatsapp,
      country: f.country,
      portfolio: f.portfolio,
      experience: f.experience,
      status: "pending",
    });
    if (error) { toast(error.message, "error"); setBusy(false); return; }
    toast("Agent application submitted", "success");
    setF((s) => ({ ...s, agent_id: "", portfolio: "", experience: "" }));
    setBusy(false);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const hasPending = requests.some((r) => r.status === "pending");
  const isApproved = profile?.agent_approved;

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Agent Status" icon={<Icon name="agent" size={22} />} onBack={() => navigate("/profile")} />

      <Card className="p-5 text-center">
        <div className="mb-3 flex justify-center text-teal-400">
          <Icon name={isApproved ? "checkCircle" : "clock"} size={44} />
        </div>
        <h2 className="text-xl font-bold text-[#e6edf3]">{isApproved ? "You are an approved agent" : "Become an Agent"}</h2>
        <p className="mt-1 text-sm text-[#8b949e]">{isApproved ? `Level ${profile?.agent_level || 0} · Earn commission on referrals.` : "Fill the application below for admin review."}</p>
        {isApproved && (
          <>
            <div className="mt-3 rounded-xl bg-[#0d1117] px-3 py-1.5 inline-block">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">Agent ID</p>
              <p className="font-mono text-sm text-[#e6edf3]">{profile?.agent_id}</p>
            </div>
            <div className="mt-4 rounded-xl bg-teal-500/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">Agent Gains</p>
              <p className="text-2xl font-black text-teal-400">${(profile?.agent_earnings || 0).toFixed(2)}</p>
            </div>
          </>
        )}
      </Card>

      {isApproved && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/messages")} className="flex flex-col items-center gap-2 rounded-2xl border border-[#21262d] bg-[#161b22] p-4">
            <Icon name="send" size={22} className="text-teal-400" />
            <span className="text-sm font-bold text-[#e6edf3]">Messages</span>
            <span className="text-xs text-[#8b949e]">Reply to your users</span>
          </button>
          <button onClick={() => navigate("/agent-tools")} className="flex flex-col items-center gap-2 rounded-2xl border border-[#21262d] bg-[#161b22] p-4">
            <Icon name="settings" size={22} className="text-teal-400" />
            <span className="text-sm font-bold text-[#e6edf3]">Agent Tools</span>
            <span className="text-xs text-[#8b949e]">Lookup & adjustments</span>
          </button>
        </div>
      )}

      {isApproved && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[#e6edf3]">Access</p>
              <p className="text-xs text-[#8b949e]">{profile?.agent_assigned_count || 0} users assigned{profile?.agent_access_limit ? ` of ${profile.agent_access_limit} limit` : " (no limit set)"}</p>
            </div>
            <Badge color={profile?.agent_access_limit && (profile?.agent_assigned_count || 0) >= profile.agent_access_limit ? "rose" : "green"}>
              {profile?.agent_access_limit ? `${profile.agent_assigned_count || 0}/${profile.agent_access_limit}` : "Unlimited"}
            </Badge>
          </div>
        </Card>
      )}

      {!isApproved && !hasPending && (
        <Card className="space-y-3 p-5">
          <h3 className="flex items-center gap-2 font-bold text-[#e6edf3]"><Icon name="edit" size={18} className="text-teal-400" /> Agent Application</h3>
          <Field label="Desired Agent ID"><Input value={f.agent_id} onChange={(e) => setF({ ...f, agent_id: e.target.value })} placeholder="e.g. AGENT-2026" /></Field>
          <Field label="Full name"><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Your name" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@email.com" /></Field>
            <Field label="WhatsApp"><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="+1 555..." /></Field>
          </div>
          <Field label="Country"><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Country" /></Field>
          <Field label="Portfolio / Links"><Textarea rows={2} value={f.portfolio} onChange={(e) => setF({ ...f, portfolio: e.target.value })} placeholder="Links to your work, socials, or store" /></Field>
          <Field label="Experience (optional)"><Textarea rows={3} value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} placeholder="Tell us why you'd be a great agent" /></Field>
          <Button className="w-full" onClick={apply} disabled={busy}>{busy ? "Submitting..." : "Submit Application"}</Button>
        </Card>
      )}

      {hasPending && !isApproved && (
        <Card className="flex items-center gap-3 p-4">
          <Icon name="clock" size={22} className="text-amber-400" />
          <div><p className="font-bold text-[#e6edf3]">Application under review</p><p className="text-sm text-[#8b949e]">We'll notify you once it's processed.</p></div>
        </Card>
      )}

      {requests.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-[#e6edf3]">Application History</h3>
          {requests.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#e6edf3]">{r.agent_id}</p><p className="text-xs text-[#8b949e]">{fmtDate(r.created_at)}</p></div>
              <Badge color={r.status === "approved" ? "green" : r.status === "rejected" ? "rose" : "amber"}>{r.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#8b949e]">{label}</label>
      {children}
    </div>
  );
}
