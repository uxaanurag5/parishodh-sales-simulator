interface CommitsChartProps {
  dailyCommits: { date: string; count: number }[];
}

export function CommitsChart({ dailyCommits }: CommitsChartProps) {
  const width = 780;
  const height = 232;
  const padLeft = 30;
  const padRight = 20;
  const chartTop = 10;
  const chartBottom = 190;
  const max = Math.max(1, ...dailyCommits.map((d) => d.count));
  const barWidth = Math.min(24, (width - padLeft - padRight) / dailyCommits.length - 6);
  const step = (width - padLeft - padRight) / Math.max(dailyCommits.length, 1);

  if (dailyCommits.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[232px] items-center justify-center text-sm text-slate-400">
        No commits in this range yet — this chart will fill in as you commit.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`Commits per day over the selected range, peaking at ${max}`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padLeft}
          y1={chartBottom - t * (chartBottom - chartTop)}
          x2={width - padRight}
          y2={chartBottom - t * (chartBottom - chartTop)}
          stroke="#EEF1F6"
          strokeWidth={1}
        />
      ))}
      {dailyCommits.map((d, i) => {
        const h = (d.count / max) * (chartBottom - chartTop);
        const x = padLeft + i * step + (step - barWidth) / 2;
        const y = chartBottom - h;
        return <rect key={d.date} x={x} y={y} width={Math.max(barWidth, 2)} height={Math.max(h, 1)} rx={4} fill="#1450A3" />;
      })}
      {dailyCommits.map((d, i) => {
        if (dailyCommits.length > 14 && i % Math.ceil(dailyCommits.length / 10) !== 0) return null;
        const x = padLeft + i * step + step / 2;
        const label = new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "2-digit" });
        return (
          <text key={d.date} x={x} y={208} fontSize={9.5} fill="#94A3B8" textAnchor="middle">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
