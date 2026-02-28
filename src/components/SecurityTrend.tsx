import { useDashboardStats } from "@/hooks/useDashboardStats";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
};

export const SecurityTrend = () => {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <TerminalPanel variant="data">
        <TerminalDivider label="Score Trend" />
        <div className="flex items-start gap-4 mt-3">
          <div className="h-4 w-28 animate-pulse bg-white/[0.03] rounded" />
          <div className="flex-1">
            <div className="h-16 w-full animate-pulse bg-white/[0.03] rounded" />
          </div>
        </div>
      </TerminalPanel>
    );
  }

  const { securityScoreTrend } = stats;

  if (securityScoreTrend.length < 2) {
    return (
      <TerminalPanel variant="data">
        <TerminalDivider label="Score Trend" />
        <p className="font-mono text-[12px] text-muted-foreground/30 text-center py-6">
          Complete more analyses to see trends
        </p>
      </TerminalPanel>
    );
  }

  const data = securityScoreTrend.map((score, index) => ({
    name: `Analysis ${index + 1}`,
    score,
  }));

  const latestScore = securityScoreTrend[securityScoreTrend.length - 1];
  const previousScore = securityScoreTrend[securityScoreTrend.length - 2];
  const trend = latestScore - previousScore;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0
      ? "text-success"
      : trend < 0
        ? "text-destructive"
        : "text-muted-foreground";
  const trendLabel = trend > 0 ? `+${trend}` : trend < 0 ? `\u2212${Math.abs(trend)}` : "0";

  return (
    <TerminalPanel variant="data">
      <TerminalDivider label="Score Trend" />
      <div className="flex items-start gap-4 mt-3">
        <div>
          <div className="font-mono text-[28px] font-bold text-muted-foreground/50 leading-none">
            {latestScore}
          </div>
          <div className={`flex items-center gap-1 font-mono text-[13px] mt-1 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trendLabel}</span>
          </div>
        </div>
        <div className="flex-1">
          <ChartContainer config={chartConfig} className="h-16 w-full">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <YAxis domain={[0, 100]} hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </TerminalPanel>
  );
};
