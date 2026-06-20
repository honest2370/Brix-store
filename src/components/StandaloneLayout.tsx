import type { ReactNode } from "react";
import { Link } from "../lib/router";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-black text-white shadow-lg shadow-indigo-500/30">
        B
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        Brix<span className="text-indigo-500">node</span>
      </span>
    </Link>
  );
}

/**
 * A stripped-down layout for "standalone" pages — individual product pages
 * and creator storefronts. No app navigation, search, notifications, or
 * footer: just a slim top bar (logo + optional tabs) so the page feels like
 * its own destination rather than a screen inside the app.
 */
export default function StandaloneLayout({
  children,
  tabs,
}: {
  children: ReactNode;
  tabs?: { label: string; to: string; active: boolean }[];
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--sa-bg, #ffffff)" }}>
      <header
        className="sticky top-0 z-40"
        style={{ background: "#0d1117", borderBottom: "1px solid #21262d" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          {tabs && tabs.length > 1 && (
            <nav className="flex items-center gap-1 rounded-xl bg-[#161b22] p-1">
              {tabs.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    t.active
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
