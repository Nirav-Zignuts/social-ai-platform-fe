import { getScoreColor } from "@/lib/post-status";
import { cn } from "@/lib/utils";

interface ReviewerScoreGaugeProps {
  score: number | null;
  size?: number;
  className?: string;
}

export function ReviewerScoreGauge({
  score,
  size = 40,
  className,
}: ReviewerScoreGaugeProps) {
  if (score === null) return null;

  const color = getScoreColor(score);
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      title={`Reviewer score: ${score}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span
        className="absolute text-[10px] font-semibold tabular-nums text-text-primary"
        style={{ fontSize: size * 0.28 }}
      >
        {score}
      </span>
    </div>
  );
}
