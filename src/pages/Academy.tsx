import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { fetchAcademyLessons, fetchAcademyProgress, markLessonComplete } from "../lib/data";
import type { AcademyLesson, AcademyProgress } from "../lib/types";
import { Card, Spinner, Badge, EmptyState, PageHeader, Button } from "../components/ui";
import Icon from "../components/Icon";

export default function Academy() {
  const { user } = useAuth();
  const { navigate, back } = useRouter();
  const toast = useToast();
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [progress, setProgress] = useState<AcademyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AcademyLesson | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [l, p] = await Promise.all([fetchAcademyLessons(), fetchAcademyProgress(user.id)]);
    setLessons(l);
    setProgress(p);
    setLoading(false);
  }

  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));
  const pct = lessons.length > 0 ? Math.round((completedIds.size / lessons.length) * 100) : 0;

  async function complete(lessonId: string) {
    if (!user) return;
    await markLessonComplete(user.id, lessonId);
    setProgress((p) => [...p, { id: "", user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() }]);
    toast("Lesson marked complete ✅", "success");
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-5 pb-10">
      <PageHeader title="Brixnode Academy" subtitle="Learn how to sell effectively on the marketplace" onBack={back} icon={<Icon name="course" size={22} />} />

      {lessons.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[#e6edf3]">Your progress</span>
            <span className="text-[#8b949e]">{completedIds.size}/{lessons.length} lessons</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#0d1117]">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${pct}%` }} />
          </div>
        </Card>
      )}

      {lessons.length === 0 ? (
        <EmptyState icon={<Icon name="course" size={36} />} title="No lessons yet" desc="The admin hasn't published any Academy lessons yet." />
      ) : (
        <div className="space-y-3">
          {lessons.map((l, i) => {
            const done = completedIds.has(l.id);
            return (
              <Card key={l.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-emerald-500 text-white" : "bg-[#0d1117] text-[#8b949e]"}`}>
                    {done ? <Icon name="check" size={14} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#e6edf3]">{l.title}</p>
                    <p className="mt-0.5 text-sm text-[#8b949e]">{l.description}</p>
                    {l.duration && <Badge color="slate" className="mt-2">{l.duration}</Badge>}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {l.video_url && (
                    <Button size="sm" variant="outline" onClick={() => setActive(l)}>▶ Watch</Button>
                  )}
                  {!done && (
                    <Button size="sm" onClick={() => complete(l.id)}>Mark complete</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}>
            <video src={active.video_url} controls autoPlay className="max-h-[80vh] w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
