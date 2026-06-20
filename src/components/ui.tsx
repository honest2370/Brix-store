import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "soft";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/20",
    soft: "bg-teal-500/15 text-teal-300 hover:bg-teal-500/25",
    ghost: "text-[#8b949e] hover:bg-[#1c2333] hover:text-[#e6edf3]",
    outline:
      "border border-[#21262d] text-[#e6edf3] hover:bg-[#1c2333]",
    danger: "bg-rose-500/90 text-white hover:bg-rose-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

const fieldCls =
  "w-full rounded-xl border border-[#21262d] bg-[#0d1117] px-4 py-2.5 text-sm text-[#e6edf3] placeholder:text-[#8b949e] outline-none transition focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldCls, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldCls, "resize-none", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldCls, className)} {...props}>
      {children}
    </select>
  );
}

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-2xl border border-[#21262d] bg-[#161b22]", className)}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = "teal",
  className,
}: {
  children: ReactNode;
  color?: "teal" | "green" | "amber" | "rose" | "slate" | "purple" | "indigo";
  className?: string;
}) {
  const colors = {
    teal: "bg-teal-500/15 text-teal-300",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    rose: "bg-rose-500/15 text-rose-300",
    slate: "bg-[#1c2333] text-[#8b949e]",
    purple: "bg-purple-500/15 text-purple-300",
    indigo: "bg-teal-500/15 text-teal-300",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", colors[color], className)}>
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn("h-6 w-6 animate-spin rounded-full border-2 border-[#21262d] border-t-teal-400", className)} />;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center text-amber-400" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? "" : "text-[#30363d]"}>★</span>
      ))}
    </span>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#21262d] bg-[#161b22]/50 px-6 py-16 text-center">
      {icon && <div className="mb-3 text-teal-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-[#e6edf3]">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-sm text-[#8b949e]">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  icon,
  right,
}: {
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="flex-shrink-0 rounded-lg p-1.5 text-[#8b949e] transition hover:bg-[#1c2333]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        {icon && <span className="flex-shrink-0 text-teal-400">{icon}</span>}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-[#e6edf3]">{title}</h1>
          {subtitle && <div className="text-sm text-[#8b949e]">{subtitle}</div>}
        </div>
      </div>
      {right && <div className="flex flex-shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}
