import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import type { HowTo } from "../lib/types";
import { Spinner, PageHeader } from "../components/ui";
import Icon from "../components/Icon";

function VideoPlayer({ url }: { url: string }) {
  if (!url) return <div className="flex h-full items-center justify-center text-[#8b949e]"><Icon name="play" size={32} /></div>;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${yt[1]}`} allowFullScreen title="v" />;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return <iframe className="h-full w-full" src={`https://player.vimeo.com/video/${vimeo[1]}`} allowFullScreen title="v" />;
  return <video className="h-full w-full" src={url} controls />;
}

export default function HowItWorks() {
  const { navigate } = useRouter();
  const toast = useToast();
  const [list, setList] = useState<HowTo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    supabase.from("how_to").select("*").order("sort", { ascending: true }).then(({ data }) => {
      setList((data as HowTo[]) || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="How It Works" icon={<Icon name="book" size={22} />} onBack={() => navigate("/profile")} />

      {list.length === 0 ? (
        <div className="space-y-4">
          {[
            ["Create an Account", "Sign up with email and verify your identity to start."],
            ["Browse & Discover", "Explore the marketplace for digital tools, AI assets and more."],
            ["Make a Payment", "Choose a payment method, pay externally and upload your proof."],
            ["Get Instant Access", "Once approved, the product unlocks instantly in your library."],
          ].map(([t, d], i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-[#21262d] bg-[#161b22] p-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/15 font-black text-teal-300">{i + 1}</span>
              <div><h3 className="font-bold text-[#e6edf3]">{t}</h3><p className="mt-1 text-sm text-[#8b949e]">{d}</p></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((v, i) => (
            <div key={v.id} className={`overflow-hidden rounded-2xl border bg-[#161b22] ${active === i ? "border-teal-500/50" : "border-[#21262d]"}`}>
              <div className="relative aspect-video bg-black">
                {active === i ? <VideoPlayer url={v.video_url} /> : (
                  <button onClick={() => setActive(i)} className="flex h-full w-full items-center justify-center" style={v.image_url ? { backgroundImage: `url(${v.image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur"><Icon name="play" size={24} className="text-white" /></span>
                  </button>
                )}
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold text-teal-400">{active === i ? "NOW PLAYING" : "TAP TO PLAY"}</span>
                <h3 className="mt-1 font-bold text-[#e6edf3]">{v.title}</h3>
                <p className="mt-1 break-words text-sm text-[#8b949e]">{v.description}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setActive(i)} className="flex items-center gap-1.5 rounded-lg border border-teal-500/40 px-4 py-2 text-xs font-bold text-teal-400"><Icon name="play" size={13} /> Play here</button>
                  <button onClick={() => { navigator.clipboard.writeText(v.video_url); toast("Link copied", "success"); }} className="flex items-center gap-1.5 rounded-lg border border-[#21262d] px-4 py-2 text-xs font-bold text-[#8b949e]"><Icon name="copy" size={13} /> Copy link</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
