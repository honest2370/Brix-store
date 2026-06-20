import { useEffect, useState } from "react";
import { fetchProducts, money } from "../lib/data";
import type { StoreBlock, StoreTheme, Product } from "../lib/types";
import ProductCard from "./ProductCard";

function videoEmbed(url: string) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${yt[1]}`} allowFullScreen title="v" />;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return <iframe className="h-full w-full" src={`https://player.vimeo.com/video/${vimeo[1]}`} allowFullScreen title="v" />;
  return <video className="h-full w-full" src={url} controls />;
}

export default function StoreRenderer({
  blocks, theme, storeName, creatorId, previewOnly,
}: {
  blocks: StoreBlock[];
  theme: StoreTheme;
  storeName: string;
  creatorId: string;
  previewOnly?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { fetchProducts({ creatorId, status: "published" }).then(setProducts); }, [creatorId]);

  const rounded = theme.rounded ?? "1rem";
  const primary = theme.primary || "#6366f1";
  const accent = theme.accent || "#a855f7";
  const text = theme.text || "#0f172a";
  const shadow = theme.shadow || "0 10px 30px rgba(0,0,0,.08)";
  const maxW = theme.maxWidth || "1100px";

  const wrap = (node: React.ReactNode, full = false) =>
    full ? node : <div style={{ maxWidth: maxW, margin: "0 auto" }}>{node}</div>;

  return (
    <div style={{ background: theme.bg || "#fff", fontFamily: theme.font, color: text }}>
      {blocks.map((b) => {
        const p = b.props as Record<string, string | number | string[]>;
        const align = (p.align as string) || "left";
        const hFont = theme.headingFont || theme.font;
        switch (b.type) {
          case "hero":
            return (
              <div key={b.id} className="relative px-6 py-20 text-center text-white sm:py-28" style={{ background: p.image ? `url(${p.image}) center/cover` : `linear-gradient(135deg, ${primary}, ${accent})` }}>
                {p.image ? <div className="absolute inset-0 bg-black/45" /> : null}
                <div className="relative mx-auto max-w-2xl">
                  <h1 className="text-4xl font-black sm:text-6xl" style={{ fontFamily: hFont }}>{p.title || storeName}</h1>
                  {p.subtitle && <p className="mt-4 text-lg opacity-90 sm:text-xl">{p.subtitle}</p>}
                  {p.cta && <a href={previewOnly ? undefined : (p.ctaUrl as string) || "#"} className="mt-7 inline-block px-7 py-3.5 font-bold" style={{ background: "#fff", color: primary, borderRadius: rounded }}>{p.cta}</a>}
                </div>
              </div>
            );
          case "banner":
            return <div key={b.id} className="px-6 py-3 text-center text-sm font-semibold text-white" style={{ background: primary }}>{p.text}</div>;
          case "announcement":
            return <div key={b.id} className="px-6 py-2 text-center text-xs font-semibold" style={{ background: accent, color: "#fff" }}>{p.text || "📢 Announcement"}</div>;
          case "heading":
            return wrap(<h2 key={b.id} className="px-6 pt-10 pb-2 text-3xl font-black" style={{ textAlign: align as "left", fontFamily: hFont }}>{p.text}</h2>);
          case "quote":
            return wrap(<blockquote key={b.id} className="px-8 py-8 text-center text-2xl font-semibold italic" style={{ color: primary }}>“{p.text}”</blockquote>);
          case "text":
            return wrap(<p key={b.id} className="px-6 py-3 leading-relaxed opacity-80" style={{ textAlign: align as "left" }}>{p.text}</p>);
          case "image_text":
            return wrap(
              <div key={b.id} className="grid items-center gap-6 px-6 py-8 sm:grid-cols-2">
                <img src={(p.image as string) || ""} alt="" className="w-full object-cover" style={{ borderRadius: rounded, minHeight: 180, background: "#e2e8f0" }} />
                <div><h3 className="text-2xl font-black" style={{ fontFamily: hFont }}>{p.title}</h3><p className="mt-2 opacity-80">{p.text}</p>{p.cta ? <a href="#" className="mt-4 inline-block px-5 py-2.5 font-bold text-white" style={{ background: primary, borderRadius: rounded }}>{p.cta}</a> : null}</div>
              </div>
            );
          case "two_column":
            return wrap(<div key={b.id} className="grid gap-6 px-6 py-8 sm:grid-cols-2"><div className="opacity-80">{p.left}</div><div className="opacity-80">{p.right}</div></div>);
          case "products":
            return wrap(
              <div key={b.id} className="px-6 py-10">
                {p.title && <h2 className="mb-5 text-3xl font-black" style={{ fontFamily: hFont }}>{p.title}</h2>}
                {products.length === 0 ? <p className="opacity-50">No products yet.</p> : (
                  <div className={theme.layout === "list" ? "space-y-3" : "grid grid-cols-2 gap-4 sm:grid-cols-3"}>
                    {products.slice(0, (p.limit as number) || 6).map((pr) => <ProductCard key={pr.id} product={pr} external />)}
                  </div>
                )}
              </div>
            );
          case "product_single": {
            const pr = products.find((x) => x.id === p.productId) || products[0];
            return wrap(<div key={b.id} className="px-6 py-8">{pr ? <div className="mx-auto max-w-xs"><ProductCard product={pr} external /></div> : <p className="opacity-50">No product</p>}</div>);
          }
          case "cards":
          case "icon_grid":
          case "features": {
            const items = (p.items as string[]) || ["Feature one|Great benefit here", "Feature two|Another benefit", "Feature three|And one more"];
            return wrap(
              <div key={b.id} className="px-6 py-10">
                {p.title && <h2 className="mb-6 text-center text-3xl font-black" style={{ fontFamily: hFont }}>{p.title}</h2>}
                <div className="grid gap-5 sm:grid-cols-3">
                  {items.map((it, i) => { const [t, d, icon] = String(it).split("|"); return (
                    <div key={i} className="p-6 text-center" style={{ background: "rgba(0,0,0,.03)", borderRadius: rounded }}>
                      <div className="mb-3 text-3xl">{icon || "✨"}</div>
                      <h4 className="font-bold">{t}</h4><p className="mt-1 text-sm opacity-70">{d}</p>
                    </div>
                  ); })}
                </div>
              </div>
            );
          }
          case "steps": {
            const items = (p.items as string[]) || ["Discover", "Pay", "Get access"];
            return wrap(<div key={b.id} className="grid gap-4 px-6 py-10 sm:grid-cols-4">{items.map((it, i) => <div key={i} className="text-center"><div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white" style={{ background: primary }}>{i + 1}</div><p className="font-semibold">{it}</p></div>)}</div>);
          }
          case "stats": {
            const items = (p.items as string[]) || ["10k+|Customers", "4.9★|Rating", "500+|Products"];
            return wrap(<div key={b.id} className="grid gap-4 px-6 py-10 text-center sm:grid-cols-3">{items.map((it, i) => { const [n, l] = String(it).split("|"); return <div key={i}><p className="text-4xl font-black" style={{ color: primary }}>{n}</p><p className="opacity-70">{l}</p></div>; })}</div>);
          }
          case "pricing": {
            const items = (p.items as string[]) || ["Basic|$9|1 license", "Pro|$29|Unlimited|⭐"];
            return wrap(<div key={b.id} className="grid gap-5 px-6 py-10 sm:grid-cols-3">{items.map((it, i) => { const [name, price, feat, star] = String(it).split("|"); return <div key={i} className="p-6 text-center" style={{ border: star ? `2px solid ${primary}` : "1px solid #e2e8f0", borderRadius: rounded }}><p className="font-bold">{name} {star}</p><p className="my-2 text-3xl font-black" style={{ color: primary }}>{price}</p><p className="text-sm opacity-70">{feat}</p></div>; })}</div>);
          }
          case "faq": {
            const items = (p.items as string[]) || ["How do I get access?|After payment approval you get a private link.", "Are refunds available?|Handled case-by-case."];
            return wrap(<div key={b.id} className="px-6 py-10"><h2 className="mb-5 text-3xl font-black" style={{ fontFamily: hFont }}>{p.title || "FAQ"}</h2><div className="space-y-3">{items.map((it, i) => { const [q, a] = String(it).split("|"); return <details key={i} className="rounded-lg p-4" style={{ background: "rgba(0,0,0,.03)", borderRadius: rounded }}><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm opacity-70">{a}</p></details>; })}</div></div>);
          }
          case "accordion": {
            const items = (p.items as string[]) || ["Section 1|Content here", "Section 2|More content"];
            return wrap(<div key={b.id} className="space-y-2 px-6 py-6">{items.map((it, i) => { const [q, a] = String(it).split("|"); return <details key={i} className="rounded-lg p-3" style={{ background: "rgba(0,0,0,.03)" }}><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm opacity-70">{a}</p></details>; })}</div>);
          }
          case "testimonial":
            return wrap(<div key={b.id} className="px-6 py-8"><div className="mx-auto max-w-xl p-7 text-center" style={{ background: "rgba(0,0,0,.03)", borderRadius: rounded, boxShadow: shadow }}><p className="text-lg italic opacity-80">“{p.quote}”</p><p className="mt-3 font-bold" style={{ color: primary }}>— {p.author}</p></div></div>);
          case "team": {
            const items = (p.items as string[]) || ["Jane|Founder", "Sam|Designer"];
            return wrap(<div key={b.id} className="grid gap-5 px-6 py-10 sm:grid-cols-4">{items.map((it, i) => { const [n, role, img] = String(it).split("|"); return <div key={i} className="text-center"><div className="mx-auto h-20 w-20 rounded-full bg-slate-200" style={img ? { background: `url(${img}) center/cover` } : {}} /><p className="mt-2 font-bold">{n}</p><p className="text-sm opacity-60">{role}</p></div>; })}</div>);
          }
          case "logos": {
            const items = (p.items as string[]) || ["🅰️", "🅱️", "🆎", "🅾️"];
            return wrap(<div key={b.id} className="flex flex-wrap items-center justify-center gap-8 px-6 py-8 text-3xl opacity-50">{items.map((it, i) => <span key={i}>{it}</span>)}</div>);
          }
          case "badge_row": {
            const items = (p.items as string[]) || ["✓ Secure", "⚡ Instant", "🔒 Verified"];
            return wrap(<div key={b.id} className="flex flex-wrap justify-center gap-3 px-6 py-6">{items.map((it, i) => <span key={i} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(0,0,0,.05)" }}>{it}</span>)}</div>);
          }
          case "marquee":
            return <div key={b.id} className="overflow-hidden whitespace-nowrap py-3 text-sm font-bold text-white" style={{ background: primary }}><span className="inline-block animate-[marquee_15s_linear_infinite]">{(p.text as string) || "🔥 Limited offer · Premium digital products · "}{(p.text as string) || "🔥 Limited offer · Premium digital products · "}</span></div>;
          case "cta_banner":
            return <div key={b.id} className="px-6 py-14 text-center text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}><h2 className="text-3xl font-black">{p.title || "Ready to start?"}</h2><p className="mt-2 opacity-90">{p.subtitle}</p><a href="#" className="mt-5 inline-block px-7 py-3 font-bold" style={{ background: "#fff", color: primary, borderRadius: rounded }}>{p.cta || "Get started"}</a></div>;
          case "newsletter":
            return wrap(<div key={b.id} className="px-6 py-10 text-center"><h3 className="text-2xl font-black">{p.title || "Join the newsletter"}</h3><div className="mx-auto mt-4 flex max-w-md gap-2"><input placeholder="you@email.com" className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5" style={{ borderRadius: rounded }} /><button className="px-5 py-2.5 font-bold text-white" style={{ background: primary, borderRadius: rounded }}>Subscribe</button></div></div>);
          case "countdown":
            return wrap(<div key={b.id} className="px-6 py-10 text-center"><h3 className="text-xl font-bold">{p.title || "Offer ends soon"}</h3><div className="mt-3 flex justify-center gap-3">{["12", "08", "45", "30"].map((n, i) => <div key={i} className="rounded-lg px-4 py-3 text-2xl font-black text-white" style={{ background: primary }}>{n}</div>)}</div></div>);
          case "social": {
            const items = (p.items as string[]) || ["🐦", "📸", "▶️", "💼"];
            return wrap(<div key={b.id} className="flex justify-center gap-4 px-6 py-6 text-2xl">{items.map((it, i) => <a key={i} href="#" className="hover:scale-110">{it}</a>)}</div>);
          }
          case "contact":
            return wrap(<div key={b.id} className="px-6 py-10"><h2 className="mb-4 text-3xl font-black">{p.title || "Contact"}</h2><div className="space-y-3"><input placeholder="Name" className="w-full rounded-lg border border-slate-300 px-4 py-2.5" /><input placeholder="Email" className="w-full rounded-lg border border-slate-300 px-4 py-2.5" /><textarea placeholder="Message" rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-2.5" /><button className="px-5 py-2.5 font-bold text-white" style={{ background: primary, borderRadius: rounded }}>Send</button></div></div>);
          case "map":
            return wrap(<div key={b.id} className="px-6 py-6"><div className="flex h-48 items-center justify-center rounded-xl bg-slate-100 text-slate-400" style={{ borderRadius: rounded }}>🗺️ {p.location || "Map location"}</div></div>);
          case "gallery": {
            const items = (p.items as string[]) || [];
            return wrap(<div key={b.id} className="grid grid-cols-2 gap-3 px-6 py-6 sm:grid-cols-3">{items.length ? items.map((it, i) => <img key={i} src={it} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: rounded }} />) : <p className="opacity-50">Add gallery images</p>}</div>);
          }
          case "image":
            return wrap(<div key={b.id} className="px-6 py-4">{p.url ? <img src={p.url as string} alt="" className="w-full" style={{ borderRadius: rounded }} /> : <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-400" style={{ borderRadius: rounded }}>No image</div>}{p.caption && <p className="mt-2 text-center text-sm opacity-60">{p.caption}</p>}</div>);
          case "video":
            return wrap(<div key={b.id} className="px-6 py-4"><div className="aspect-video overflow-hidden bg-black" style={{ borderRadius: rounded }}>{p.url ? videoEmbed(p.url as string) : <div className="flex h-full items-center justify-center text-white/50">Add video URL</div>}</div></div>);
          case "button":
            return wrap(<div key={b.id} className="px-6 py-4 text-center"><a href={previewOnly ? undefined : (p.url as string)} className="inline-block px-7 py-3 font-bold text-white" style={{ background: primary, borderRadius: rounded }}>{p.label}</a></div>);
          case "embed":
          case "html":
            return wrap(<div key={b.id} className="px-6 py-4" dangerouslySetInnerHTML={{ __html: (p.code as string) || "<p style='opacity:.5'>Paste embed/HTML code</p>" }} />);
          case "footer":
            return <footer key={b.id} className="px-6 py-10 text-center text-sm opacity-70" style={{ background: "rgba(0,0,0,.04)" }}>{p.text || `© ${new Date().getFullYear()} ${storeName}`}</footer>;
          case "divider":
            return <hr key={b.id} className="mx-6 my-4 border-slate-200" />;
          case "spacer":
            return <div key={b.id} style={{ height: (p.height as number) || 40 }} />;
          default:
            return null;
        }
      })}
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

export { money };
