import { useEffect, useState } from "react";
import { fetchTrustScore, trustTierFor } from "../lib/data";
import type { TrustScore } from "../lib/types";
import { Badge } from "./ui";

const TIER_EMOJI: Record<string, string> = {
  new: "🌱",
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  elite: "💎",
};

export default function TrustBadge({ userId, size = "md" }: { userId: string; size?: "sm" | "md" }) {
  const [score, setScore] = useState<TrustScore | null>(null);

  useEffect(() => {
    fetchTrustScore(userId).then(setScore);
  }, [userId]);

  if (!score || score.sales_count === 0) return null;

  const tier = trustTierFor(score.score);
  const color = tier.color as "slate" | "amber" | "purple";

  return (
    <Badge color={color} className={size === "sm" ? "text-[10px]" : undefined}>
      {TIER_EMOJI[tier.tier]} {tier.label} · {score.score}/100
    </Badge>
  );
}
