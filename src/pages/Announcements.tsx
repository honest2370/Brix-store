import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { supabase } from "../lib/supabase";
import type { Announcement } from "../lib/types";
import { Spinner, PageHeader, Badge } from "../components/ui";
import Icon from "../components/Icon";

export default function Announcements() {
  const { navigate } = useRouter();
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Announcement | null>(null);

  useEffect(() => {
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setList((data as Announcement[]) || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Announcements" icon={<Icon name="megaphone" size={22} />} onBack={() => navigate("/profile")} />

      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : list.length === 0 ? (
        <p className="py-10 text-center text-[#8b949e]">No announcements yet.</p>
      ) : (
        <div className="space-y-5">
          {list.map((a, i) => (
            <button key={a.id} onClick={() => setOpen(a)} className="block w-full overflow-hidden rounded-2xl border border-[#21262d] bg-[#161b22] text-left">
              <div className="relative h-48 bg-gradient-to-br from-teal-900/60 to-[#0d1117]">
                {a.image_url ? <img src={a.image_url} alt="" className="h-full w-full object-cover" /> : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center"><Icon name="megaphone" size={36} className="text-teal-400" /><p className="mt-2 break-words text-lg font-black text-teal-300">{a.subtitle || a.title}</p></div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">NEWS</span>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase text-teal-400">{a.tag || "OFFICIAL UPDATE"}{i === 0 ? " • #01" : ""}</p>
                <h3 className="mt-1 break-words text-lg font-bold text-[#e6edf3]">{a.title}</h3>
                <p className="mt-1 break-words text-sm text-[#8b949e] line-clamp-2">{a.body}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[#8b949e]"><Icon name="clock" size={13} /> {a.date || "Recent"}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-teal-400">Read more <Icon name="chevron" size={13} /></span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpen(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[#21262d] bg-[#161b22] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            {open.image_url && <img src={open.image_url} alt="" className="h-48 w-full object-cover" />}
            <div className="p-5">
              <div className="flex items-center justify-between"><Badge color="teal">{open.tag || "OFFICIAL UPDATE"}</Badge><button onClick={() => setOpen(null)} className="text-[#8b949e]"><Icon name="close" size={18} /></button></div>
              <h2 className="mt-2 break-words text-xl font-bold text-[#e6edf3]">{open.title}</h2>
              {open.video_url && <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black"><video src={open.video_url} controls className="h-full w-full" /></div>}
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#8b949e]">{open.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
