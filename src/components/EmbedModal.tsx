import { useState } from "react";
import { useToast } from "../lib/toast";
import { money } from "../lib/data";
import type { Product } from "../lib/types";
import { Button, Card } from "./ui";

export default function EmbedModal({
  product,
  url,
  onClose,
}: {
  product: Product;
  url: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<"card" | "button" | "iframe">("card");

  const cardEmbed = `<!-- Brixnode product card -->
<a href="${url}" target="_blank" rel="noopener" style="display:block;max-width:320px;font-family:system-ui,sans-serif;text-decoration:none;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.06)">
  ${product.cover_url ? `<img src="${product.cover_url}" alt="${product.title}" style="width:100%;height:160px;object-fit:cover"/>` : ""}
  <div style="padding:14px">
    <div style="font-weight:700;color:#0f172a">${product.title}</div>
    <div style="color:#64748b;font-size:13px;margin:4px 0 10px">${product.short_desc || ""}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:800;color:#4f46e5">${Number(product.price) === 0 ? "Free" : money(product.price)}</span>
      <span style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;padding:6px 14px;border-radius:10px;font-size:13px;font-weight:700">Get it</span>
    </div>
  </div>
</a>`;

  const buttonEmbed = `<!-- Brixnode buy button -->
<a href="${url}" target="_blank" rel="noopener" style="display:inline-block;font-family:system-ui,sans-serif;background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none">
  Buy ${product.title} — ${Number(product.price) === 0 ? "Free" : money(product.price)}
</a>`;

  const iframeEmbed = `<!-- Brixnode iframe embed -->
<iframe src="${url}" style="width:100%;max-width:420px;height:560px;border:0;border-radius:16px" loading="lazy" title="${product.title}"></iframe>`;

  const code = tab === "card" ? cardEmbed : tab === "button" ? buttonEmbed : iframeEmbed;

  function copy() {
    navigator.clipboard.writeText(code);
    toast("Embed code copied! Paste it on any site 🚀", "success");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{"</>"} Embed product</h3>
            <p className="text-sm text-slate-500">Add this product to any website, blog or store.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <div className="flex gap-2 px-5 pt-4">
          {(["card", "button", "iframe"] as const).map((tt) => (
            <button key={tt} onClick={() => setTab(tt)} className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold capitalize ${tab === tt ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{tt}</button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</p>
            <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: tab === "iframe" ? `<div style="padding:20px;border:1px dashed #cbd5e1;border-radius:12px;color:#94a3b8;font-size:13px">Iframe embed (renders the live product page)</div>` : code }} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Embed code</p>
            <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-emerald-300">{code}</pre>
          </div>
          <Button className="w-full" onClick={copy}>📋 Copy embed code</Button>
        </div>
      </Card>
    </div>
  );
}
