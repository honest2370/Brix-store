import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import Drawer from "./Drawer";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-500/30">
        B
      </span>
      <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Brix<span className="text-indigo-500">node</span>
      </span>
    </Link>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = `h-6 w-6 ${active ? "text-teal-400" : "text-[#8b949e]"}`;
  const icons: Record<string, ReactNode> = {
    home: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" /></svg>
    ),
    explore: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4-4" /></svg>
    ),
    library: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4zM9 5v14" /></svg>
    ),
    sell: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10l2-6h14l2 6M5 10v10h14V10M9 14h6" /></svg>
    ),
    account: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
    ),
  };
  return <>{icons[name]}</>;
}

export default function Layout({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const push = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count }) => setNotifCount(count || 0));
  }, [user, path]);

  // Real-time push notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title?: string };
          setNotifCount((c) => c + 1);
          push((n.title || "New notification") + " 🔔", "info");
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, push]);

  const isActive = (p: string) =>
    p === "/" ? path === "/" : path.startsWith(p);

  const navLinks = [
    { to: "/", label: t("home"), icon: "home" },
    { to: "/explore", label: t("explore"), icon: "explore" },
    { to: "/library", label: t("library"), icon: "library" },
    { to: "/sell", label: t("sell"), icon: "sell" },
  ];

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Top bar — fintech dark */}
      <header className="sticky top-0 z-40" style={{ background: "#0d1117", borderBottom: "1px solid #21262d" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            {/* Hamburger for drawer */}
            <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 text-[#8b949e] hover:bg-[#161b22]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive(l.to)
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              {profile?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive("/admin")
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-[#8b949e] hover:bg-[#161b22]"
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <Link to="/explore" className="rounded-lg p-2 text-[#8b949e] hover:bg-[#161b22]" aria-label="Search">
              <Icon name="search" size={20} />
            </Link>
            {user && (
              <Link to="/notifications" className="relative rounded-lg p-2 text-[#8b949e] hover:bg-[#161b22]" aria-label="Notifications">
                <Icon name="bell" size={20} />
                {notifCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{notifCount}</span>
                )}
              </Link>
            )}
            {!user && (
              <Link to="/auth" className="ml-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="mt-12 hidden py-10 md:block" style={{ background: "#0d1117", borderTop: "1px solid #21262d" }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-[#8b949e]">
              The elevated hub for digital tools, AI assets, templates,
              knowledge & creation.
            </p>
          </div>
          <FooterCol title="Marketplace" links={[["Explore", "/explore"], ["Sell on Brixnode", "/sell"], ["My Library", "/library"]]} />
          <FooterCol title="Company" links={[["About", "/page/about"], ["Creator Agreement", "/page/creators"], ["Contact", "/page/contact"]]} />
          <FooterCol title="Legal" links={[["Terms of Service", "/page/terms"], ["Privacy Policy", "/page/privacy"], ["DMCA & Refunds", "/page/dmca"]]} />
        </div>
        <p className="mt-8 text-center text-xs text-[#8b949e]">
          © {new Date().getFullYear()} Brixnode. Secure manual-payment digital
          marketplace.
        </p>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 md:hidden" style={{ background: "#0d1117", borderTop: "1px solid #21262d" }}>
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex flex-col items-center gap-0.5 py-2.5"
          >
            <NavIcon name={l.icon} active={isActive(l.to)} />
            <span
              className={`text-[10px] font-semibold ${
                isActive(l.to)
                  ? "text-teal-400"
                  : "text-[#8b949e]"
              }`}
            >
              {l.label}
            </span>
          </Link>
        ))}
        <Link
          to={user ? "/profile" : "/auth"}
          className="flex flex-col items-center gap-0.5 py-2.5"
        >
          <NavIcon name="account" active={isActive("/profile") || isActive("/auth")} />
          <span
            className={`text-[10px] font-semibold ${
              isActive("/profile") || isActive("/auth")
                ? "text-teal-400"
                : "text-[#8b949e]"
            }`}
          >
            {t("account")}
          </span>
        </Link>
      </nav>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
          <h4 className="mb-3 text-sm font-bold text-[#e6edf3]">
            {title}
          </h4>
          <ul className="space-y-2">
            {links.map(([label, to]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm text-[#8b949e] hover:text-teal-400"
                >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
