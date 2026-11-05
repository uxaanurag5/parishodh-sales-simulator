interface TopbarProps {
  developerName: string;
  developerRole: string;
  days: number;
  onDaysChange: (days: number) => void;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ developerName, developerRole, days, onDaysChange }: TopbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-8 py-3.5">
      <div>
        <h1 className="m-0 text-2xl font-bold text-slate-900">Hi {developerName.split(" ")[0]},</h1>
        <p className="m-0 text-[13px] text-slate-500">Your real development activity, pulled live.</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] text-slate-700"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>

        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0D1B2A] text-xs font-bold text-white">
            {initialsOf(developerName)}
          </span>
          <span className="flex flex-col items-start">
            <span className="text-[13px] font-semibold leading-tight text-slate-900">{developerName}</span>
            <span className="text-[11px] leading-tight text-slate-400">{developerRole}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
