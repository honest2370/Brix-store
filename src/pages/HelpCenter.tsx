import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { fetchHelpTopics, fetchHelpBlocks } from "../lib/data";
import type { HelpTopic, HelpBlock } from "../lib/types";
import { Card, Spinner, EmptyState, PageHeader } from "../components/ui";
import Icon from "../components/Icon";

export default function HelpCenter() {
  const { back } = useRouter();
  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<HelpBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);

  useEffect(() => {
    fetchHelpTopics().then((t) => { setTopics(t); setLoading(false); });
  }, []);

  async function openTopic(slug: string) {
    setActiveSlug(slug);
    setBlocksLoading(true);
    setBlocks(await fetchHelpBlocks(slug));
    setBlocksLoading(false);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  const activeTopic = topics.find((t) => t.slug === activeSlug);

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-5 pb-10">
      <PageHeader
        title={activeTopic ? activeTopic.title : "Help Center"}
        subtitle={activeTopic ? undefined : "Answers to common questions about buying and selling"}
        onBack={activeSlug ? () => setActiveSlug(null) : back}
        icon={<Icon name={(activeTopic?.icon as "question") || "question"} size={22} />}
      />

      {!activeSlug ? (
        topics.length === 0 ? (
          <EmptyState icon={<Icon name="question" size={36} />} title="No help topics yet" desc="The admin hasn't published any help topics yet." />
        ) : (
          <div className="space-y-2">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => openTopic(t.slug)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-left transition hover:border-teal-500/40"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
                  <Icon name={(t.icon as "question") || "question"} size={16} />
                </span>
                <span className="flex-1 font-semibold text-[#e6edf3]">{t.title}</span>
                <Icon name="chevron" size={14} className="text-[#8b949e]" />
              </button>
            ))}
          </div>
        )
      ) : blocksLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : blocks.length === 0 ? (
        <EmptyState icon={<Icon name="question" size={36} />} title="Nothing here yet" desc="This topic doesn't have content yet." />
      ) : (
        <div className="space-y-4">
          {blocks.map((b) => (
            <Card key={b.id} className="p-5">
              {b.heading && <h3 className="mb-2 font-bold text-[#e6edf3]">{b.heading}</h3>}
              {b.type === "text" && <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#8b949e]">{b.body}</p>}
              {b.type === "image" && b.media_url && <img src={b.media_url} alt={b.heading} className="w-full rounded-xl" />}
              {b.type === "video" && b.media_url && <video src={b.media_url} controls className="w-full rounded-xl" />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
