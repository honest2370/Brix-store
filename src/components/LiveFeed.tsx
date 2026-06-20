import { useEffect, useState } from "react";
import { fetchLiveFeed, subscribeLiveFeed, fetchProduct, type LiveFeedEvent } from "../lib/data";
import Icon from "./Icon";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** A horizontally auto-scrolling ticker of recent approved purchases — social proof for the homepage. */
export default function LiveFeed() {
  const [events, setEvents] = useState<LiveFeedEvent[]>([]);

  useEffect(() => {
    fetchLiveFeed(14).then(setEvents);
    const unsub = subscribeLiveFeed(async (o) => {
      const p = o.product_id ? await fetchProduct(o.product_id) : null;
      setEvents((list) => [
        { id: o.id, product_title: p?.title || "a product", buyer_username: "someone", created_at: new Date().toISOString() },
        ...list,
      ].slice(0, 20));
    });
    return unsub;
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#21262d] bg-[#161b22] py-3">
      <div className="flex animate-[marquee_30s_linear_infinite] gap-8 whitespace-nowrap px-4 hover:[animation-play-state:paused]">
        {[...events, ...events].map((e, i) => (
          <span key={e.id + i} className="inline-flex items-center gap-2 text-sm text-[#8b949e]">
            <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
            <Icon name="bag" size={14} className="text-teal-400" />
            <span className="font-semibold text-[#e6edf3]">@{e.buyer_username}</span>
            <span>just got</span>
            <span className="max-w-[160px] truncate font-semibold text-teal-400">{e.product_title}</span>
            <span className="text-[#586069]">· {timeAgo(e.created_at)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
