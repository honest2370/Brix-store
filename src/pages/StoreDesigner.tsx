import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { uploadFile } from "../lib/data";
import type { StoreBlock, StoreBlockType, StoreTheme } from "../lib/types";
import { Button, Input, Textarea, Card, Select } from "../components/ui";
import StoreRenderer from "../components/StoreRenderer";

function uid() { return Math.random().toString(36).slice(2, 9); }

const SECTIONS: { type: StoreBlockType; label: string; icon: string; cat: string }[] = [
  // Headers / hero
  { type: "hero", label: "Hero banner", icon: "🌅", cat: "Headers" },
  { type: "banner", label: "Top banner", icon: "📛", cat: "Headers" },
  { type: "announcement", label: "Announcement", icon: "📢", cat: "Headers" },
  { type: "marquee", label: "Marquee", icon: "🎞️", cat: "Headers" },
  // Content
  { type: "heading", label: "Heading", icon: "🔠", cat: "Content" },
  { type: "text", label: "Text block", icon: "📝", cat: "Content" },
  { type: "quote", label: "Quote", icon: "❝", cat: "Content" },
  { type: "two_column", label: "Two columns", icon: "🗂️", cat: "Content" },
  { type: "image_text", label: "Image + text", icon: "🖼️", cat: "Content" },
  { type: "accordion", label: "Accordion", icon: "📚", cat: "Content" },
  // Commerce
  { type: "products", label: "Products grid", icon: "🛍️", cat: "Commerce" },
  { type: "product_single", label: "Single product", icon: "🏷️", cat: "Commerce" },
  { type: "pricing", label: "Pricing table", icon: "💲", cat: "Commerce" },
  { type: "cta_banner", label: "CTA banner", icon: "🚀", cat: "Commerce" },
  { type: "countdown", label: "Countdown", icon: "⏳", cat: "Commerce" },
  // Social proof
  { type: "testimonial", label: "Testimonial", icon: "💬", cat: "Social proof" },
  { type: "stats", label: "Stats", icon: "📊", cat: "Social proof" },
  { type: "logos", label: "Logo cloud", icon: "🏢", cat: "Social proof" },
  { type: "team", label: "Team", icon: "👥", cat: "Social proof" },
  { type: "badge_row", label: "Trust badges", icon: "🛡️", cat: "Social proof" },
  // Features
  { type: "features", label: "Features grid", icon: "✨", cat: "Features" },
  { type: "cards", label: "Cards", icon: "🃏", cat: "Features" },
  { type: "icon_grid", label: "Icon grid", icon: "🔣", cat: "Features" },
  { type: "steps", label: "Steps / how-to", icon: "🪜", cat: "Features" },
  { type: "faq", label: "FAQ", icon: "❓", cat: "Features" },
  // Media
  { type: "image", label: "Image", icon: "🏞️", cat: "Media" },
  { type: "gallery", label: "Gallery", icon: "🖼️", cat: "Media" },
  { type: "video", label: "Video", icon: "🎬", cat: "Media" },
  // Engagement
  { type: "newsletter", label: "Newsletter", icon: "📧", cat: "Engagement" },
  { type: "social", label: "Social links", icon: "🔗", cat: "Engagement" },
  { type: "contact", label: "Contact form", icon: "✉️", cat: "Engagement" },
  { type: "map", label: "Map", icon: "🗺️", cat: "Engagement" },
  // Advanced
  { type: "button", label: "Button", icon: "🔘", cat: "Advanced" },
  { type: "embed", label: "Embed code", icon: "</>", cat: "Advanced" },
  { type: "html", label: "Raw HTML", icon: "📜", cat: "Advanced" },
  { type: "divider", label: "Divider", icon: "➖", cat: "Advanced" },
  { type: "spacer", label: "Spacer", icon: "⬜", cat: "Advanced" },
  { type: "footer", label: "Footer", icon: "👣", cat: "Advanced" },
];

const FONTS = ["Inter", "Georgia", "Poppins", "Playfair Display", "Roboto Mono", "Montserrat", "Lora", "Oswald", "Merriweather", "Courier New"];

const PRESETS: { name: string; theme: StoreTheme }[] = [
  { name: "Indigo", theme: { primary: "#6366f1", accent: "#a855f7", bg: "#ffffff", text: "#0f172a", font: "Inter" } },
  { name: "Midnight", theme: { primary: "#818cf8", accent: "#22d3ee", bg: "#0b1120", text: "#e2e8f0", font: "Inter" } },
  { name: "Emerald", theme: { primary: "#10b981", accent: "#14b8a6", bg: "#f0fdf4", text: "#064e3b", font: "Poppins" } },
  { name: "Sunset", theme: { primary: "#f97316", accent: "#ec4899", bg: "#fff7ed", text: "#431407", font: "Montserrat" } },
  { name: "Rose", theme: { primary: "#e11d48", accent: "#f43f5e", bg: "#fff1f2", text: "#4c0519", font: "Playfair Display" } },
  { name: "Slate Pro", theme: { primary: "#0f172a", accent: "#475569", bg: "#f8fafc", text: "#0f172a", font: "Inter" } },
  { name: "Ocean", theme: { primary: "#0ea5e9", accent: "#6366f1", bg: "#f0f9ff", text: "#0c4a6e", font: "Lora" } },
  { name: "Gold Luxe", theme: { primary: "#b45309", accent: "#d97706", bg: "#fffbeb", text: "#451a03", font: "Playfair Display" } },
  { name: "Cyberpunk", theme: { primary: "#d946ef", accent: "#22d3ee", bg: "#09090b", text: "#fafafa", font: "Roboto Mono" } },
  { name: "Mint", theme: { primary: "#059669", accent: "#84cc16", bg: "#ffffff", text: "#14532d", font: "Montserrat" } },
  { name: "Berry", theme: { primary: "#7c3aed", accent: "#db2777", bg: "#faf5ff", text: "#3b0764", font: "Poppins" } },
  { name: "Mono", theme: { primary: "#111827", accent: "#6b7280", bg: "#ffffff", text: "#111827", font: "Courier New" } },
];

function defaultProps(type: StoreBlockType): Record<string, unknown> {
  switch (type) {
    case "hero": return { title: "Welcome to my store", subtitle: "Premium digital products", image: "", cta: "Browse products" };
    case "banner": return { text: "🔥 Limited-time launch offer" };
    case "announcement": return { text: "📢 New products dropped!" };
    case "marquee": return { text: "🔥 Premium products · Instant delivery · " };
    case "heading": return { text: "Section title", align: "left" };
    case "text": return { text: "Add your description here...", align: "left" };
    case "quote": return { text: "A great quote about your work" };
    case "two_column": return { left: "Left column content", right: "Right column content" };
    case "image_text": return { title: "Feature title", text: "Describe it here", image: "", cta: "Learn more" };
    case "products": return { title: "Featured products", limit: 6 };
    case "product_single": return { productId: "" };
    case "features": case "cards": case "icon_grid": return { title: "Why choose us", items: ["Fast|Instant delivery|⚡", "Secure|Verified payments|🔒", "Quality|Top creators|⭐"] };
    case "steps": return { items: ["Discover", "Pay", "Get access"] };
    case "stats": return { items: ["10k+|Customers", "4.9★|Rating", "500+|Products"] };
    case "pricing": return { items: ["Basic|$9|1 license", "Pro|$29|Unlimited|⭐"] };
    case "faq": return { title: "FAQ", items: ["How do I get access?|After approval you get a private link.", "Refunds?|Case-by-case."] };
    case "accordion": return { items: ["Section 1|Content", "Section 2|More"] };
    case "testimonial": return { quote: "Amazing products!", author: "Happy customer" };
    case "team": return { items: ["Jane|Founder", "Sam|Designer"] };
    case "logos": return { items: ["🅰️", "🅱️", "🆎", "🅾️"] };
    case "badge_row": return { items: ["✓ Secure", "⚡ Instant", "🔒 Verified"] };
    case "cta_banner": return { title: "Ready to start?", subtitle: "Join thousands of buyers", cta: "Get started" };
    case "newsletter": return { title: "Join the newsletter" };
    case "countdown": return { title: "Offer ends soon" };
    case "social": return { items: ["🐦", "📸", "▶️", "💼"] };
    case "contact": return { title: "Contact us" };
    case "map": return { location: "New York, USA" };
    case "gallery": return { items: [] };
    case "image": return { url: "", caption: "" };
    case "video": return { url: "" };
    case "button": return { label: "Click me", url: "#" };
    case "embed": case "html": return { code: "" };
    case "footer": return { text: "" };
    case "spacer": return { height: 40 };
    default: return {};
  }
}

const LIST_BLOCKS: StoreBlockType[] = ["features", "cards", "icon_grid", "steps", "stats", "pricing", "faq", "accordion", "team", "logos", "badge_row", "social", "gallery"];

export default function StoreDesigner() {
  const { user, profile, updateProfile } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [blocks, setBlocks] = useState<StoreBlock[]>([]);
  const [theme, setTheme] = useState<StoreTheme>({});
  const [storeName, setStoreName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [cat, setCat] = useState("Headers");
  const [tab, setTab] = useState<"sections" | "theme">("sections");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (profile) {
      setBlocks(profile.store_blocks?.length ? profile.store_blocks : [{ id: uid(), type: "hero", props: defaultProps("hero") }, { id: uid(), type: "products", props: defaultProps("products") }]);
      setTheme(profile.store_theme && Object.keys(profile.store_theme).length ? profile.store_theme : PRESETS[0].theme);
      setStoreName(profile.store_name || "");
    }
  }, [profile, user]);

  function addBlock(type: StoreBlockType) { const b = { id: uid(), type, props: defaultProps(type) }; setBlocks((prev) => [...prev, b]); setSelected(b.id); toast("Section added", "success"); }
  function move(id: string, dir: -1 | 1) { setBlocks((prev) => { const i = prev.findIndex((b) => b.id === id); const j = i + dir; if (j < 0 || j >= prev.length) return prev; const c = [...prev]; [c[i], c[j]] = [c[j], c[i]]; return c; }); }
  function dup(id: string) { setBlocks((prev) => { const b = prev.find((x) => x.id === id); if (!b) return prev; const i = prev.findIndex((x) => x.id === id); const copy = [...prev]; copy.splice(i + 1, 0, { ...b, id: uid() }); return copy; }); }
  function remove(id: string) { setBlocks((prev) => prev.filter((b) => b.id !== id)); setSelected(null); }
  function setProp(id: string, key: string, value: unknown) { setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b))); }

  async function save() {
    setSaving(true);
    const { error } = await updateProfile({ store_blocks: blocks, store_theme: theme, store_name: storeName });
    if (error) toast(error, "error"); else toast("Store saved & published! 🎨", "success");
    setSaving(false);
  }

  const sel = blocks.find((b) => b.id === selected);
  const cats = [...new Set(SECTIONS.map((s) => s.cat))];
  const storeUrl = profile?.username ? `${window.location.origin}/@${profile.username}` : "";

  if (preview) {
    return (
      <div className="animate-fade">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={() => setPreview(false)}>← Back to editor</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDevice(device === "desktop" ? "mobile" : "desktop")}>{device === "desktop" ? "📱 Mobile" : "🖥️ Desktop"}</Button>
            {storeUrl && <Button variant="soft" onClick={() => window.open(storeUrl, "_blank")}>Open live store ↗</Button>}
          </div>
        </div>
        <div className="mx-auto overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800" style={{ maxWidth: device === "mobile" ? 400 : "100%" }}>
          <StoreRenderer blocks={blocks} theme={theme} storeName={storeName} creatorId={user!.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">🎨 Store Designer Pro</h1>
          <p className="text-sm text-slate-500">{SECTIONS.length}+ sections · {PRESETS.length} themes · 50+ tools · Desktop builder</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setDevice(device === "desktop" ? "mobile" : "desktop")}>{device === "desktop" ? "🖥️" : "📱"}</Button>
          <Button variant="outline" onClick={() => setPreview(true)}>👁 Preview</Button>
          {storeUrl && <Button variant="outline" onClick={() => window.open(storeUrl, "_blank")}>Open ↗</Button>}
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save & Publish"}</Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr_320px]">
        {/* Left panel */}
        <div className="space-y-3">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button onClick={() => setTab("sections")} className={`flex-1 rounded-lg py-1.5 text-sm font-semibold ${tab === "sections" ? "bg-white shadow dark:bg-slate-700" : "text-slate-500"}`}>Sections</button>
            <button onClick={() => setTab("theme")} className={`flex-1 rounded-lg py-1.5 text-sm font-semibold ${tab === "theme" ? "bg-white shadow dark:bg-slate-700" : "text-slate-500"}`}>Theme</button>
          </div>

          {tab === "sections" ? (
            <Card className="p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${cat === c ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{c}</button>)}
              </div>
              <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto">
                {SECTIONS.filter((s) => s.cat === cat).map((s) => (
                  <button key={s.type} onClick={() => addBlock(s.type)} className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 p-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:text-slate-300">
                    <span className="text-lg">{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="space-y-3 p-4">
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store name" />
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Theme presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((pr) => (
                    <button key={pr.name} onClick={() => setTheme({ ...theme, ...pr.theme })} className="rounded-lg border border-slate-200 p-2 text-[10px] font-semibold dark:border-slate-700" title={pr.name}>
                      <div className="mb-1 flex h-5 overflow-hidden rounded"><span className="flex-1" style={{ background: pr.theme.primary }} /><span className="flex-1" style={{ background: pr.theme.accent }} /><span className="flex-1" style={{ background: pr.theme.bg }} /></div>
                      {pr.name}
                    </button>
                  ))}
                </div>
              </div>
              <ColorRow label="Primary" value={theme.primary || "#6366f1"} onChange={(v) => setTheme({ ...theme, primary: v })} />
              <ColorRow label="Accent" value={theme.accent || "#a855f7"} onChange={(v) => setTheme({ ...theme, accent: v })} />
              <ColorRow label="Background" value={theme.bg || "#ffffff"} onChange={(v) => setTheme({ ...theme, bg: v })} />
              <ColorRow label="Text" value={theme.text || "#0f172a"} onChange={(v) => setTheme({ ...theme, text: v })} />
              <SelectRow label="Body font" value={theme.font || "Inter"} options={FONTS} onChange={(v) => setTheme({ ...theme, font: v })} />
              <SelectRow label="Heading font" value={theme.headingFont || theme.font || "Inter"} options={FONTS} onChange={(v) => setTheme({ ...theme, headingFont: v })} />
              <SelectRow label="Product layout" value={theme.layout || "grid"} options={["grid", "list", "magazine"]} onChange={(v) => setTheme({ ...theme, layout: v as StoreTheme["layout"] })} />
              <SelectRow label="Corners" value={theme.rounded || "1rem"} options={["0", "0.5rem", "1rem", "1.75rem"]} onChange={(v) => setTheme({ ...theme, rounded: v })} />
              <SelectRow label="Max width" value={theme.maxWidth || "1100px"} options={["900px", "1100px", "1300px", "100%"]} onChange={(v) => setTheme({ ...theme, maxWidth: v })} />
            </Card>
          )}
        </div>

        {/* Canvas */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800">
            <span>{blocks.length} sections · click to edit</span>
            <span>{device === "desktop" ? "🖥️ Desktop" : "📱 Mobile"}</span>
          </div>
          <div className="max-h-[72vh] overflow-y-auto bg-slate-100 p-3 dark:bg-slate-950">
            <div className="mx-auto overflow-hidden rounded-lg bg-white shadow-lg dark:bg-slate-900" style={{ maxWidth: device === "mobile" ? 380 : "100%", fontFamily: theme.font }}>
              {blocks.length === 0 && <p className="p-10 text-center text-slate-400">Add sections from the left to build your store.</p>}
              {blocks.map((b) => (
                <div key={b.id} onClick={() => setSelected(b.id)} className={`group relative cursor-pointer ${selected === b.id ? "ring-2 ring-indigo-500 ring-inset" : ""}`}>
                  <StoreRenderer blocks={[b]} theme={theme} storeName={storeName} creatorId={user!.id} previewOnly />
                  <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                    <button onClick={(e) => { e.stopPropagation(); move(b.id, -1); }} className="rounded bg-black/60 px-2 py-1 text-xs text-white">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); move(b.id, 1); }} className="rounded bg-black/60 px-2 py-1 text-xs text-white">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); dup(b.id); }} className="rounded bg-black/60 px-2 py-1 text-xs text-white">⧉</button>
                    <button onClick={(e) => { e.stopPropagation(); remove(b.id); }} className="rounded bg-rose-500 px-2 py-1 text-xs text-white">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right editor */}
        <Card className="max-h-[78vh] overflow-y-auto p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">{sel ? `Edit: ${SECTIONS.find((s) => s.type === sel.type)?.label}` : "Select a section"}</h3>
          {sel ? <BlockEditor block={sel} setProp={(k, v) => setProp(sel.id, k, v)} /> : <p className="text-sm text-slate-400">Click any section in the canvas to edit its content & options.</p>}
        </Card>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-slate-200 dark:border-slate-700" /></div>;
}
function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <div><label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label><Select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</Select></div>;
}

const LIST_BLOCKS_SET = new Set(LIST_BLOCKS);

function BlockEditor({ block, setProp }: { block: StoreBlock; setProp: (k: string, v: unknown) => void }) {
  const toast = useToast();
  const p = block.props as Record<string, unknown>;
  async function up(key: string, f: File | null) { if (!f) return; const r = await uploadFile(f, "store"); if (r.url) { setProp(key, r.url); toast("Uploaded", "success"); } else toast("Upload failed", "error"); }
  const T = ({ k, label, area }: { k: string; label: string; area?: boolean }) => (
    <div><label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>{area ? <Textarea rows={3} value={(p[k] as string) || ""} onChange={(e) => setProp(k, e.target.value)} /> : <Input value={(p[k] as string) || ""} onChange={(e) => setProp(k, e.target.value)} />}</div>
  );
  const Img = ({ k, label }: { k: string; label: string }) => (
    <label className="block cursor-pointer rounded-lg border border-dashed border-slate-300 p-2 text-center text-xs font-semibold text-slate-500 dark:border-slate-700">{p[k] ? `✓ ${label} set` : `Upload ${label}`}<input type="file" accept="image/*" className="hidden" onChange={(e) => up(k, e.target.files?.[0] || null)} /></label>
  );

  return (
    <div className="space-y-3">
      {block.type === "hero" && (<><T k="title" label="Title" /><T k="subtitle" label="Subtitle" /><T k="cta" label="Button text" /><T k="ctaUrl" label="Button link" /><Img k="image" label="background" /></>)}
      {(block.type === "banner" || block.type === "announcement" || block.type === "marquee") && <T k="text" label="Text" />}
      {(block.type === "heading" || block.type === "text" || block.type === "quote") && (<><T k="text" label="Text" area={block.type !== "heading"} /><AlignPicker p={p} setProp={setProp} /></>)}
      {block.type === "two_column" && (<><T k="left" label="Left" area /><T k="right" label="Right" area /></>)}
      {block.type === "image_text" && (<><T k="title" label="Title" /><T k="text" label="Text" area /><T k="cta" label="Button text" /><Img k="image" label="image" /></>)}
      {block.type === "products" && (<><T k="title" label="Section title" /><div><label className="mb-1 block text-xs font-semibold text-slate-500">Max products</label><Input type="number" value={p.limit as number} onChange={(e) => setProp("limit", Number(e.target.value))} /></div></>)}
      {block.type === "product_single" && <T k="productId" label="Product ID" />}
      {block.type === "testimonial" && (<><T k="quote" label="Quote" area /><T k="author" label="Author" /></>)}
      {(block.type === "cta_banner" || block.type === "newsletter" || block.type === "countdown") && (<><T k="title" label="Title" /><T k="subtitle" label="Subtitle" /><T k="cta" label="Button" /></>)}
      {block.type === "contact" && <T k="title" label="Title" />}
      {block.type === "map" && <T k="location" label="Location" />}
      {block.type === "image" && (<><Img k="url" label="image" /><T k="caption" label="Caption" /></>)}
      {block.type === "video" && <T k="url" label="Video URL (YouTube/Vimeo/mp4)" />}
      {block.type === "button" && (<><T k="label" label="Label" /><T k="url" label="Link" /></>)}
      {(block.type === "embed" || block.type === "html") && <T k="code" label="HTML / embed code" area />}
      {block.type === "footer" && <T k="text" label="Footer text" />}
      {block.type === "spacer" && <div><label className="mb-1 block text-xs font-semibold text-slate-500">Height (px)</label><Input type="number" value={p.height as number} onChange={(e) => setProp("height", Number(e.target.value))} /></div>}
      {(block.type === "gallery") && <GalleryEditor p={p} setProp={setProp} />}
      {LIST_BLOCKS_SET.has(block.type) && block.type !== "gallery" && <ListEditor p={p} setProp={setProp} hint={listHint(block.type)} />}
    </div>
  );
}

function listHint(type: StoreBlockType) {
  if (type === "features" || type === "cards" || type === "icon_grid") return "Title|Description|icon";
  if (type === "stats") return "10k+|Customers";
  if (type === "pricing") return "Pro|$29|Unlimited|⭐(optional)";
  if (type === "faq" || type === "accordion") return "Question|Answer";
  if (type === "team") return "Name|Role|imageUrl(optional)";
  return "one item per line";
}

function ListEditor({ p, setProp, hint }: { p: Record<string, unknown>; setProp: (k: string, v: unknown) => void; hint: string }) {
  const items = (p.items as string[]) || [];
  return (
    <div>
      {p.title !== undefined && <div className="mb-2"><label className="mb-1 block text-xs font-semibold text-slate-500">Section title</label><Input value={(p.title as string) || ""} onChange={(e) => setProp("title", e.target.value)} /></div>}
      <label className="mb-1 block text-xs font-semibold text-slate-500">Items — format: {hint}</label>
      <Textarea rows={6} value={items.join("\n")} onChange={(e) => setProp("items", e.target.value.split("\n").filter((x) => x.trim()))} placeholder={hint} />
    </div>
  );
}

function GalleryEditor({ p, setProp }: { p: Record<string, unknown>; setProp: (k: string, v: unknown) => void }) {
  const toast = useToast();
  const items = (p.items as string[]) || [];
  async function add(f: File | null) { if (!f) return; const r = await uploadFile(f, "store"); if (r.url) { setProp("items", [...items, r.url]); toast("Added", "success"); } }
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">Gallery images</label>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => <div key={i} className="relative"><img src={it} alt="" className="h-14 w-14 rounded object-cover" /><button onClick={() => setProp("items", items.filter((_, x) => x !== i))} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">✕</button></div>)}
        <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 text-xl text-slate-400 dark:border-slate-700">+<input type="file" accept="image/*" className="hidden" onChange={(e) => add(e.target.files?.[0] || null)} /></label>
      </div>
    </div>
  );
}

function AlignPicker({ p, setProp }: { p: Record<string, unknown>; setProp: (k: string, v: unknown) => void }) {
  return (
    <div><label className="mb-1 block text-xs font-semibold text-slate-500">Alignment</label><div className="flex gap-1">{["left", "center", "right"].map((a) => <button key={a} onClick={() => setProp("align", a)} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize ${p.align === a ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{a}</button>)}</div></div>
  );
}
