import { useEffect, useState } from "react";
import { fetchSalesGoal, saveSalesGoal, money } from "../lib/data";
import { Button, Card, Input } from "./ui";

export default function GoalTracker({ userId, currentRevenue }: { userId: string; currentRevenue: number }) {
  const [target, setTarget] = useState<number>(0);
  const [periodLabel, setPeriodLabel] = useState("This month");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesGoal(userId).then((g) => {
      if (g) {
        setTarget(Number(g.target_amount));
        setPeriodLabel(g.period_label);
      }
      setLoading(false);
    });
  }, [userId]);

  async function save() {
    const amount = Number(draft);
    if (!amount || amount <= 0) return;
    await saveSalesGoal(userId, amount, periodLabel);
    setTarget(amount);
    setEditing(false);
  }

  if (loading) return null;

  const pct = target > 0 ? Math.min(100, Math.round((currentRevenue / target) * 100)) : 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#e6edf3]">🎯 Sales Goal — {periodLabel}</h3>
        {target > 0 && !editing && (
          <button onClick={() => { setDraft(String(target)); setEditing(true); }} className="text-xs font-semibold text-teal-400 hover:underline">
            Edit
          </button>
        )}
      </div>

      {target === 0 && !editing ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-[#8b949e]">Set a revenue goal to track your progress.</p>
          <div className="flex gap-2">
            <Input type="number" placeholder="e.g. 500" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Button onClick={save}>Set goal</Button>
          </div>
        </div>
      ) : editing ? (
        <div className="mt-3 flex gap-2">
          <Input type="number" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <Button onClick={save}>Save</Button>
          <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-end justify-between text-sm">
            <span className="font-bold text-[#e6edf3]">{money(currentRevenue)}</span>
            <span className="text-[#8b949e]">of {money(target)}</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#0d1117]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-[#8b949e]">
            {pct >= 100 ? "🎉 Goal reached!" : `${pct}% there — keep going!`}
          </p>
        </div>
      )}
    </Card>
  );
}
