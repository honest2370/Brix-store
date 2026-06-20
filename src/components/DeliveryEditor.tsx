import { useState } from "react";
import { useToast } from "../lib/toast";
import { uploadFile, typeKind } from "../lib/data";
import type { DeliveryPayload, StockItem, CourseModule } from "../lib/types";
import { Button, Input, Textarea } from "./ui";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function DeliveryEditor({
  type,
  delivery,
  setDelivery,
  stockItems,
  setStockItems,
}: {
  type: string;
  delivery: DeliveryPayload;
  setDelivery: (d: DeliveryPayload) => void;
  stockItems: StockItem[];
  setStockItems: (s: StockItem[]) => void;
}) {
  const kind = typeKind(type);

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/5">
      <h3 className="mb-1 font-bold text-slate-900 dark:text-white">
        📦 Delivery & access setup
      </h3>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Configure exactly what the buyer receives after their purchase is
        approved.
      </p>

      {kind === "file" && (
        <FileDelivery delivery={delivery} setDelivery={setDelivery} />
      )}
      {kind === "course" && (
        <CourseDelivery delivery={delivery} setDelivery={setDelivery} />
      )}
      {kind === "prompt" && (
        <PromptDelivery delivery={delivery} setDelivery={setDelivery} />
      )}
      {kind === "stock" && (
        <StockDelivery
          delivery={delivery}
          setDelivery={setDelivery}
          stockItems={stockItems}
          setStockItems={setStockItems}
        />
      )}
    </div>
  );
}

/* ---------------- FILE (templates, ebooks, presets, etc.) ---------------- */
function FileDelivery({
  delivery,
  setDelivery,
}: {
  delivery: DeliveryPayload;
  setDelivery: (d: DeliveryPayload) => void;
}) {
  const toast = useToast();
  const files = delivery.files || [];
  const links = delivery.external_links || [];
  const [uploading, setUploading] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  async function addFile(f: File | null) {
    if (!f) return;
    setUploading(true);
    const up = await uploadFile(f, "deliverables");
    if (up.url) {
      setDelivery({ ...delivery, files: [...files, { name: f.name, url: up.url }] });
      toast("File uploaded", "success");
    } else toast("Upload failed (create 'uploads' bucket)", "error");
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Downloadable files
        </label>
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
              <span className="text-sm">📄</span>
              <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{f.name}</span>
              <button onClick={() => setDelivery({ ...delivery, files: files.filter((_, x) => x !== i) })} className="text-rose-500">✕</button>
            </div>
          ))}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            {uploading ? "Uploading..." : "⬆ Upload file (zip, pdf, etc.)"}
            <input type="file" className="hidden" onChange={(e) => addFile(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          External links (Notion duplicate, Drive, Canva...)
        </label>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
              <span className="text-sm">🔗</span>
              <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{l.label}</span>
              <button onClick={() => setDelivery({ ...delivery, external_links: links.filter((_, x) => x !== i) })} className="text-rose-500">✕</button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label" className="w-32" />
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            <Button size="sm" variant="soft" onClick={() => {
              if (!linkUrl) return;
              setDelivery({ ...delivery, external_links: [...links, { label: linkLabel || "Open link", url: linkUrl }] });
              setLinkLabel(""); setLinkUrl("");
            }}>Add</Button>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Access note (instructions for buyer)</label>
        <Textarea rows={2} value={delivery.access_note || ""} onChange={(e) => setDelivery({ ...delivery, access_note: e.target.value })} placeholder="How to use, license info..." />
      </div>
    </div>
  );
}

/* ---------------- COURSE (modules + lessons + videos) ---------------- */
function CourseDelivery({
  delivery,
  setDelivery,
}: {
  delivery: DeliveryPayload;
  setDelivery: (d: DeliveryPayload) => void;
}) {
  const toast = useToast();
  const modules = delivery.modules || [];

  function update(mods: CourseModule[]) {
    setDelivery({ ...delivery, modules: mods });
  }
  function addModule() {
    update([...modules, { id: uid(), title: `Module ${modules.length + 1}`, lessons: [] }]);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Build your curriculum in chapters (modules) and lessons. Each lesson can
        have a video, description, duration and attachment.
      </p>
      {modules.map((m, mi) => (
        <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-500/20">{mi + 1}</span>
            <Input value={m.title} onChange={(e) => { const c = [...modules]; c[mi] = { ...m, title: e.target.value }; update(c); }} placeholder="Module title" />
            <button onClick={() => update(modules.filter((_, x) => x !== mi))} className="text-rose-500">✕</button>
          </div>
          <div className="mt-3 space-y-2 pl-8">
            {m.lessons.map((les, li) => (
              <div key={les.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Input value={les.title} onChange={(e) => { const c = [...modules]; c[mi].lessons[li] = { ...les, title: e.target.value }; update(c); }} placeholder="Lesson title" />
                  <Input value={les.duration} onChange={(e) => { const c = [...modules]; c[mi].lessons[li] = { ...les, duration: e.target.value }; update(c); }} placeholder="12:30" className="w-20" />
                  <button onClick={() => { const c = [...modules]; c[mi].lessons = c[mi].lessons.filter((_, x) => x !== li); update(c); }} className="text-rose-500">✕</button>
                </div>
                <Input className="mt-2" value={les.video_url} onChange={(e) => { const c = [...modules]; c[mi].lessons[li] = { ...les, video_url: e.target.value }; update(c); }} placeholder="Video URL (YouTube, Vimeo, mp4) or upload below" />
                <div className="mt-2 flex gap-2">
                  <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    ⬆ Upload video
                    <input type="file" accept="video/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      toast("Uploading video...", "info");
                      const up = await uploadFile(f, "videos");
                      if (up.url) { const c = [...modules]; c[mi].lessons[li] = { ...les, video_url: up.url }; update(c); toast("Video uploaded", "success"); }
                      else toast("Upload failed", "error");
                    }} />
                  </label>
                  <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    📎 Attachment
                    <input type="file" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const up = await uploadFile(f, "attachments");
                      if (up.url) { const c = [...modules]; c[mi].lessons[li] = { ...les, attachment_url: up.url }; update(c); toast("Attached", "success"); }
                    }} />
                  </label>
                </div>
                <Textarea className="mt-2" rows={2} value={les.description} onChange={(e) => { const c = [...modules]; c[mi].lessons[li] = { ...les, description: e.target.value }; update(c); }} placeholder="Lesson notes / description" />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => { const c = [...modules]; c[mi].lessons.push({ id: uid(), title: `Lesson ${m.lessons.length + 1}`, video_url: "", description: "", duration: "" }); update(c); }}>
              + Add lesson
            </Button>
          </div>
        </div>
      ))}
      <Button variant="soft" onClick={addModule}>+ Add module / chapter</Button>
    </div>
  );
}

/* ---------------- PROMPT PACK ---------------- */
function PromptDelivery({
  delivery,
  setDelivery,
}: {
  delivery: DeliveryPayload;
  setDelivery: (d: DeliveryPayload) => void;
}) {
  const prompts = delivery.prompts || [];
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">Add each prompt buyers unlock after purchase.</p>
      {prompts.map((p, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Input value={p.title} onChange={(e) => { const c = [...prompts]; c[i] = { ...p, title: e.target.value }; setDelivery({ ...delivery, prompts: c }); }} placeholder={`Prompt ${i + 1} title`} />
            <button onClick={() => setDelivery({ ...delivery, prompts: prompts.filter((_, x) => x !== i) })} className="text-rose-500">✕</button>
          </div>
          <Textarea className="mt-2" rows={3} value={p.body} onChange={(e) => { const c = [...prompts]; c[i] = { ...p, body: e.target.value }; setDelivery({ ...delivery, prompts: c }); }} placeholder="Full prompt text..." />
        </div>
      ))}
      <Button variant="soft" onClick={() => setDelivery({ ...delivery, prompts: [...prompts, { title: "", body: "" }] })}>+ Add prompt</Button>
    </div>
  );
}

/* ---------------- STOCK (accounts / proxies in slots) ---------------- */
function StockDelivery({
  delivery,
  setDelivery,
  stockItems,
  setStockItems,
}: {
  delivery: DeliveryPayload;
  setDelivery: (d: DeliveryPayload) => void;
  stockItems: StockItem[];
  setStockItems: (s: StockItem[]) => void;
}) {
  const [bulk, setBulk] = useState("");
  const available = stockItems.filter((s) => !s.sold).length;

  function addBulk() {
    const rows = bulk.split("\n").map((r) => r.trim()).filter(Boolean);
    setStockItems([...stockItems, ...rows.map((value) => ({ value, sold: false }))]);
    setBulk("");
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          📊 Inventory slots: <span className="text-emerald-600">{available} available</span>
          <span className="text-slate-400"> / {stockItems.length} total</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">Each purchase automatically consumes one slot. When slots reach 0, the product shows "Out of stock".</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Add account/proxy slots (one per line)</label>
        <Textarea rows={4} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"user1:pass1\nuser2:pass2\n192.168.0.1:8080:user:pass"} />
        <Button size="sm" className="mt-2" variant="soft" onClick={addBulk}>+ Add {bulk.split("\n").filter((r) => r.trim()).length || ""} slots</Button>
      </div>
      {stockItems.length > 0 && (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl bg-white p-2 dark:bg-slate-900">
          {stockItems.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${s.sold ? "bg-slate-100 text-slate-400 line-through dark:bg-slate-800" : "bg-emerald-50 text-slate-700 dark:bg-emerald-500/10 dark:text-slate-200"}`}>
              <span className="flex-1 truncate font-mono">{s.value}</span>
              {s.sold ? <span className="text-rose-400">sold</span> : <button onClick={() => setStockItems(stockItems.filter((_, x) => x !== i))} className="text-rose-500">✕</button>}
            </div>
          ))}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Setup instructions (shown after purchase)</label>
        <Textarea rows={2} value={delivery.account_instructions || ""} onChange={(e) => setDelivery({ ...delivery, account_instructions: e.target.value })} placeholder="How to log in, warranty info, etc." />
      </div>
    </div>
  );
}
