import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { uploadFile, fetchSettings } from "../lib/data";
import Icon, { type IconName } from "../components/Icon";

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [avatar, setAvatar] = useState("");
  const [copiedMember, setCopiedMember] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [socials, setSocials] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (profile) setAvatar(profile.avatar_url || "");
    fetchSettings().then(setSocials);
  }, [profile, user]);

  async function upAvatar(f: File | null) {
    if (!f) return;
    const r = await uploadFile(f, "avatars");
    if (r.url) { setAvatar(r.url); await updateProfile({ avatar_url: r.url }); toast("Avatar updated", "success"); }
  }

  const memberId = profile?.id?.slice(0, 16) || "";
  const referralLink = `${window.location.origin}/auth?ref=${encodeURIComponent(profile?.username || "")}`;

  if (!profile) return null;

  const socialLinks: { key: string; icon: IconName }[] = [
    { key: "whatsapp", icon: "whatsapp" }, { key: "telegram", icon: "telegram" },
    { key: "facebook", icon: "facebook" }, { key: "instagram", icon: "instagram" },
    { key: "tiktok", icon: "tiktok" }, { key: "twitter", icon: "twitter" }, { key: "youtube", icon: "youtube" },
  ];
  const activeSocials = socialLinks.filter((s) => socials[s.key]);

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-4">
        <div className="relative">
          {avatar ? <img src={avatar} className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-500" /> : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500"><Icon name="user" size={34} className="text-white" /></div>
          )}
          <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-teal-500 text-white shadow-lg">
            <Icon name="camera" size={14} /><input type="file" accept="image/*" className="hidden" onChange={(e) => upAvatar(e.target.files?.[0] || null)} />
          </label>
        </div>
        <h2 className="mt-3 text-xl font-bold text-[#e6edf3]">{profile.full_name || profile.username}</h2>
        <p className="break-all text-sm text-[#8b949e]">{profile.email}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-400"><Icon name="shieldCheck" size={13} /> Verified Member</span>
      </div>

      {/* Member ID + Referral */}
      <div className="space-y-3">
        <InfoCard label="Member ID" value={`${memberId}...`} copied={copiedMember} onCopy={() => { navigator.clipboard.writeText(memberId); setCopiedMember(true); setTimeout(() => setCopiedMember(false), 2000); }} />
        {profile.is_agent && profile.agent_approved && (
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-teal-400">Agent ID</p>
            <code className="text-sm font-mono text-[#e6edf3]">{profile.agent_id}</code>
          </div>
        )}
        <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">Referral ID</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-sm font-mono text-[#e6edf3]">{referralLink}</code>
            <button onClick={() => { navigator.clipboard.writeText(referralLink); setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2000); }} className="flex-shrink-0 rounded-lg bg-teal-500/20 p-2 text-teal-400">
              <Icon name={copiedRef ? "check" : "copy"} size={15} />
            </button>
          </div>
          <p className="mt-1 text-xs text-[#8b949e]">Total referrals: 0</p>
        </div>
      </div>

      {/* Balance */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-900/30 to-yellow-900/20 p-5" style={{ border: "1px solid rgba(245,158,11,.2)" }}>
        <div className="flex items-center gap-3">
          <Icon name="coin" size={28} className="text-amber-400" />
          <div><p className="text-[10px] font-bold uppercase text-[#8b949e]">Wallet Balance</p><p className="text-3xl font-black text-amber-400">${(profile.balance || 0).toFixed(2)}</p></div>
        </div>
      </div>

      {/* Deposit / Income */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-4">
          <div className="mb-1 flex items-center gap-2 text-teal-400"><Icon name="wallet" size={16} /><p className="text-[10px] font-bold uppercase text-[#8b949e]">Deposit</p></div>
          <p className="text-lg font-black text-[#e6edf3]">$0.00</p>
        </div>
        <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-4">
          <div className="mb-1 flex items-center gap-2 text-teal-400"><Icon name="chart" size={16} /><p className="text-[10px] font-bold uppercase text-[#8b949e]">Income</p></div>
          <p className="text-lg font-black text-[#e6edf3]">$0.00</p>
        </div>
      </div>

      {/* Social icons */}
      {activeSocials.length > 0 && (
        <div className="flex justify-center gap-3 flex-wrap">
          {activeSocials.map((s) => (
            <a key={s.key} href={socials[s.key]} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 transition hover:bg-purple-500/30 shadow-md" style={{ width: 52, height: 52 }}>
              <Icon name={s.icon} size={26} />
            </a>
          ))}
        </div>
      )}

      {/* Menu */}
      <div className="overflow-hidden rounded-2xl border border-[#21262d] bg-[#161b22]">
        <MenuItem icon="deposit" label="Deposit History" onClick={() => navigate("/deposit")} />
        <MenuItem icon="card" label="Transaction History" onClick={() => navigate("/transactions")} />
        <MenuItem icon="withdraw" label="Withdraw History" onClick={() => navigate("/withdraw")} />
        <SectionLabel>Community</SectionLabel>
        <MenuItem icon="agent" label="Agent Status" onClick={() => navigate("/agent")} />
        <MenuItem icon="search" label="Find an Agent" onClick={() => navigate("/agents")} />
        <MenuItem icon="send" label="Messages" onClick={() => navigate("/messages")} />
        <MenuItem icon="trophy" label="Leaderboard" onClick={() => navigate("/leaderboard")} />
        <SectionLabel>Help & Info</SectionLabel>
        <MenuItem icon="ticket" label="Support Tickets" onClick={() => navigate("/support")} />
        <MenuItem icon="book" label="How To Work" onClick={() => navigate("/how-it-works")} />
        <MenuItem icon="megaphone" label="Announcements" onClick={() => navigate("/announcements")} />
        <MenuItem icon="building" label="About Company" onClick={() => navigate("/page/about")} />
        <MenuItem icon="doc" label="Terms & Conditions" onClick={() => navigate("/page/terms")} />
        <MenuItem icon="shield" label="Privacy Policy" onClick={() => navigate("/page/privacy")} />
      </div>

      <button onClick={() => navigate("/account")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#21262d] bg-[#161b22] py-3.5 font-bold text-[#e6edf3]">
        <Icon name="settings" size={18} /> Settings
      </button>
    </div>
  );
}

function InfoCard({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-sm font-mono text-[#e6edf3]">{value}</code>
        <button onClick={onCopy} className="flex-shrink-0 rounded-lg bg-teal-500/20 p-2 text-teal-400"><Icon name={copied ? "check" : "copy"} size={15} /></button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">{children}</p>;
}

function MenuItem({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-[#21262d] px-4 py-3 text-sm font-semibold text-[#e6edf3] transition last:border-b-0 hover:bg-[#1c2333]">
      <Icon name={icon} size={18} className="text-teal-400" />
      <span className="flex-1 text-left">{label}</span>
      <Icon name="chevron" size={14} className="text-[#8b949e]" />
    </button>
  );
}
