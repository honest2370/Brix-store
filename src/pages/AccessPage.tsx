import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { fetchOrderByToken, typeKind, typeLabel } from "../lib/data";
import { supabase } from "../lib/supabase";
import type { Order, CourseLesson } from "../lib/types";
import { Spinner, Badge, Card, Button } from "../components/ui";
import { TypeIcon } from "../components/Icons";

export default function AccessPage({ token }: { token: string }) {
  const { navigate } = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderByToken(token).then((o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  if (!order) return (
    <div className="py-20 text-center">
      <p className="text-4xl">🔒</p>
      <p className="mt-3 font-bold text-slate-800 dark:text-slate-100">Invalid access link</p>
      <Link to="/explore" className="mt-3 inline-block text-indigo-500">← Explore</Link>
    </div>
  );

  if (order.status !== "approved") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center animate-fade">
        <p className="text-5xl">⏳</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Awaiting approval</h1>
        <p className="mt-2 text-slate-500">Your payment is being verified by an admin. Once approved, this page unlocks your product and we'll send the link to <b>{order.contact_email || order.contact_whatsapp}</b>.</p>
        <Badge color={order.status === "rejected" ? "rose" : "amber"} className="mt-4">{order.status}</Badge>
        {order.admin_note && <p className="mt-3 text-sm text-rose-500">Note: {order.admin_note}</p>}
        <div className="mt-6"><Button onClick={() => navigate("/explore")}>Browse more</Button></div>
      </div>
    );
  }

  const p = order.product!;
  const kind = typeKind(p.type);

  return (
    <div className="animate-fade">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="flex items-center gap-2"><span className="text-2xl">✅</span><h1 className="text-xl font-bold">Access granted!</h1></div>
        <p className="mt-1 text-sm opacity-90">You now have full access to <b>{p.title}</b>. Bookmark this page.</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"><TypeIcon type={p.type} className="h-6 w-6" /></span>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{p.title}</h2>
          <p className="text-sm text-slate-500">{typeLabel(p.type)} · by @{p.creator?.username}</p>
        </div>
      </div>

      <div className="mt-6">
        {kind === "course" && <CourseViewer order={order} />}
        {kind === "file" && <FileViewer order={order} />}
        {kind === "prompt" && <PromptViewer order={order} />}
        {kind === "stock" && <StockViewer order={order} />}
      </div>
    </div>
  );
}

/* ---------- Course viewer with professional video player ---------- */
function videoEmbed(url: string) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${yt[1]}`} allowFullScreen title="video" />;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return <iframe className="h-full w-full" src={`https://player.vimeo.com/video/${vimeo[1]}`} allowFullScreen title="video" />;
  return <video className="h-full w-full" src={url} controls />;
}

function CourseViewer({ order }: { order: Order }) {
  const modules = order.product?.delivery?.modules || [];
  const allLessons = modules.flatMap((m) => m.lessons);
  const [active, setActive] = useState<CourseLesson | null>(allLessons[0] || null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (!order.buyer_id) return;
    supabase.from("progress").select("completed_lessons").eq("user_id", order.buyer_id).eq("product_id", order.product_id).maybeSingle().then(({ data }) => {
      if (data) setCompleted(data.completed_lessons || []);
    });
  }, []);

  async function toggleDone(id: string) {
    const next = completed.includes(id) ? completed.filter((x) => x !== id) : [...completed, id];
    setCompleted(next);
    if (order.buyer_id) {
      await supabase.from("progress").upsert({ user_id: order.buyer_id, product_id: order.product_id, completed_lessons: next, updated_at: new Date().toISOString() }, { onConflict: "user_id,product_id" });
    }
  }

  const pct = allLessons.length ? Math.round((completed.length / allLessons.length) * 100) : 0;

  if (!modules.length) return <Card className="p-6 text-center text-slate-500">Course content is being prepared.</Card>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">{active ? videoEmbed(active.video_url) : <div className="flex h-full items-center justify-center text-white/50">Select a lesson</div>}</div>
        {active && (
          <Card className="mt-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">{active.title}</h3>
              <Button size="sm" variant={completed.includes(active.id) ? "soft" : "outline"} onClick={() => toggleDone(active.id)}>{completed.includes(active.id) ? "✓ Completed" : "Mark complete"}</Button>
            </div>
            {active.duration && <p className="text-xs text-slate-400">⏱ {active.duration}</p>}
            {active.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{active.description}</p>}
            {active.attachment_url && <a href={active.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10">📎 Download attachment</a>}
          </Card>
        )}
      </div>
      <div>
        <Card className="p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-slate-500"><span>Progress</span><span>{pct}%</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {modules.map((m, mi) => (
              <div key={m.id}>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Module {mi + 1}: {m.title}</p>
                <div className="space-y-1">
                  {m.lessons.map((les) => (
                    <button key={les.id} onClick={() => setActive(les)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${active?.id === les.id ? "bg-indigo-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                      <span>{completed.includes(les.id) ? "✓" : "▶"}</span>
                      <span className="flex-1 truncate">{les.title}</span>
                      {les.duration && <span className="text-xs opacity-60">{les.duration}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FileViewer({ order }: { order: Order }) {
  const d = order.product?.delivery || {};
  return (
    <div className="space-y-4">
      {d.access_note && <Card className="border-indigo-200 bg-indigo-50/50 p-4 text-sm text-slate-700 dark:border-indigo-500/30 dark:bg-indigo-500/5 dark:text-slate-200">{d.access_note}</Card>}
      {(d.files || []).length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 font-bold text-slate-900 dark:text-white">⬇ Downloads</h3>
          <div className="space-y-2">
            {(d.files || []).map((f, i) => (
              <a key={i} href={f.url} download target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700">
                <span className="text-xl">📄</span>
                <span className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{f.name}</span>
                <span className="rounded-lg bg-indigo-500 px-3 py-1 text-xs font-bold text-white">Download</span>
              </a>
            ))}
          </div>
        </Card>
      )}
      {(d.external_links || []).length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 font-bold text-slate-900 dark:text-white">🔗 Access links</h3>
          <div className="space-y-2">
            {(d.external_links || []).map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 dark:border-slate-700">
                <span className="text-xl">🌐</span>
                <span className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{l.label}</span>
                <span className="text-indigo-500">→</span>
              </a>
            ))}
          </div>
        </Card>
      )}
      {!d.files?.length && !d.external_links?.length && <Card className="p-6 text-center text-slate-500">Your files are being prepared. Check your email/WhatsApp.</Card>}
    </div>
  );
}

function PromptViewer({ order }: { order: Order }) {
  const prompts = order.product?.delivery?.prompts || [];
  return (
    <div className="space-y-3">
      {prompts.length === 0 && <Card className="p-6 text-center text-slate-500">Prompts are being prepared.</Card>}
      {prompts.map((p, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">{p.title || `Prompt ${i + 1}`}</h3>
            <Button size="sm" variant="soft" onClick={() => { navigator.clipboard.writeText(p.body); }}>Copy</Button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{p.body}</pre>
        </Card>
      ))}
    </div>
  );
}

function StockViewer({ order }: { order: Order }) {
  const payload = order.delivered_payload as { value?: string };
  const instructions = order.product?.delivery?.account_instructions;
  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/5">
        <h3 className="mb-2 font-bold text-slate-900 dark:text-white">🔐 Your account / slot</h3>
        {payload?.value ? (
          <div className="flex items-center gap-2 rounded-lg bg-white p-3 dark:bg-slate-900">
            <code className="flex-1 select-all break-all font-mono text-sm text-slate-800 dark:text-slate-100">{payload.value}</code>
            <Button size="sm" variant="soft" onClick={() => navigator.clipboard.writeText(payload.value || "")}>Copy</Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Your slot will be delivered to {order.contact_email || order.contact_whatsapp}.</p>
        )}
      </Card>
      {instructions && <Card className="p-4 text-sm text-slate-600 dark:text-slate-300"><b>Instructions:</b><p className="mt-1 whitespace-pre-wrap">{instructions}</p></Card>}
    </div>
  );
}
