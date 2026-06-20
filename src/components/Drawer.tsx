import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import Icon, { type IconName } from "./Icon";
import { money } from "../lib/data";

export default function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { navigate } = useRouter();
  const { profile, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const { lang, setLang } = useI18n();

  const sections: { label: string; items: { icon: IconName; label: string; to: string; external?: boolean }[] }[] = [
    { label: "Main", items: [
      { icon: "home", label: "Home", to: "/" },
      { icon: "search", label: "Explore", to: "/explore" },
      { icon: "library", label: "Library", to: "/library" },
      { icon: "heart", label: "Wishlist", to: "/wishlist" },
      { icon: "bag", label: "Creator Studio", to: "/sell" },
      { icon: "graphics", label: "Store Designer", to: "/store-designer-pro.html", external: true },
    ]},
    { label: "Sell more", items: [
      { icon: "gift", label: "Bundle Builder", to: "/bundles" },
      { icon: "zap", label: "Flash Sales", to: "/flash-sales" },
      { icon: "agent", label: "Affiliate Marketplace", to: "/affiliate-marketplace" },
      { icon: "coin", label: "Plans", to: "/plans" },
    ]},
    { label: "Wallet & History", items: [
      { icon: "deposit", label: "Deposit", to: "/deposit" },
      { icon: "card", label: "Transactions", to: "/transactions" },
      { icon: "withdraw", label: "Withdraw", to: "/withdraw" },
      { icon: "chart", label: "Payouts", to: "/payouts" },
      { icon: "doc", label: "Orders", to: "/orders" },
      { icon: "doc", label: "Invoices", to: "/invoices" },
      { icon: "doc", label: "Receipts", to: "/receipts" },
    ]},
    { label: "Community", items: [
      { icon: "agent", label: "Agent Status", to: "/agent" },
      { icon: "trophy", label: "Leaderboard", to: "/leaderboard" },
      { icon: "course", label: "Academy", to: "/academy" },
      ...(profile?.role === "admin" ? [{ icon: "shield" as IconName, label: "Admin Panel", to: "/admin" }] : []),
    ]},
    { label: "Help & Info", items: [
      { icon: "question", label: "Help Center", to: "/help" },
      { icon: "ticket", label: "Support", to: "/support" },
      { icon: "book", label: "How It Works", to: "/how-it-works" },
      { icon: "megaphone", label: "Announcements", to: "/announcements" },
      { icon: "building", label: "About", to: "/page/about" },
      { icon: "doc", label: "Terms", to: "/page/terms" },
      { icon: "shield", label: "Privacy", to: "/page/privacy" },
    ]},
    { label: "Account", items: [
      { icon: "user", label: "Profile", to: "/profile" },
      { icon: "settings", label: "Settings", to: "/account" },
      { icon: "bell", label: "Notifications", to: "/notifications" },
    ]},
  ];

  function go(to: string, external?: boolean) {
    onClose();
    if (external) { window.open(to, "_blank"); return; }
    navigate(to);
  }
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-slide absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-[#0d1117]" style={{ borderRight: "1px solid #21262d" }}>
        <div className="flex items-center gap-3 border-b border-[#21262d] p-4">
          {profile?.avatar_url ? <img src={profile.avatar_url} className="h-10 w-10 rounded-full object-cover ring-2 ring-teal-500" alt="" /> : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500"><Icon name="user" size={20} className="text-white" /></div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#e6edf3]">{profile?.full_name || profile?.username || "Guest"}</p>
            <p className="truncate text-xs text-[#8b949e]">{profile?.email || "Not signed in"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#8b949e] hover:bg-[#161b22]"><Icon name="close" size={18} /></button>
        </div>

        {profile && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-900/40 to-emerald-900/30 p-3" style={{ border: "1px solid rgba(20,184,166,.2)" }}>
            <Icon name="wallet" size={22} className="text-teal-400" />
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b949e]">Wallet Balance</p><p className="text-lg font-black text-teal-400">{money(profile.balance || 0)}</p></div>
          </div>
        )}

        <div className="mt-3 space-y-4 px-3 pb-24">
          {sections.map((sec) => (
            <div key={sec.label}>
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">{sec.label}</p>
              <div className="space-y-0.5">
                {sec.items.map((item) => (
                  <button key={item.to + item.label} onClick={() => go(item.to, item.external)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#e6edf3] transition hover:bg-[#161b22]">
                    <Icon name={item.icon} size={18} className="text-teal-400" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <Icon name="chevron" size={14} className="text-[#8b949e]" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* preferences */}
          <div className="flex gap-2">
            <button onClick={toggle} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#21262d] py-2.5 text-sm font-semibold text-[#e6edf3]"><Icon name={dark ? "moon" : "sun"} size={16} /> {dark ? "Dark" : "Light"}</button>
            <button onClick={() => setLang(lang === "en" ? "fr" : "en")} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#21262d] py-2.5 text-sm font-semibold text-[#e6edf3]"><Icon name="globe" size={16} /> {lang === "en" ? "Français" : "English"}</button>
          </div>

          {profile ? (
            <button onClick={() => { signOut(); go("/"); }} className="flex w-full items-center gap-3 rounded-lg border border-[#21262d] px-3 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10"><Icon name="logout" size={18} /> Sign out</button>
          ) : (
            <button onClick={() => go("/auth")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-2.5 text-sm font-bold text-white"><Icon name="user" size={18} /> Sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
