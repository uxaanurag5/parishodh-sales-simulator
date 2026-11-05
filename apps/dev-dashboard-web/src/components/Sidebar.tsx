interface NavItem {
  key: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Developer Dashboard" },
  { key: "integrations", label: "Integrations & Settings" },
];

export function Sidebar({ active, onSelect }: { active: string; onSelect: (key: string) => void }) {
  return (
    <div className="flex w-[240px] flex-shrink-0 flex-col gap-6 bg-navy-900 p-4">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-[17px] font-bold text-white">
          P
        </div>
        <div>
          <div className="text-[17px] font-bold leading-tight text-white">Parishodh</div>
          <div className="text-[11px] leading-tight text-[#7E94B8]">Learn · Build · Grow</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`w-full rounded-[10px] px-3.5 py-2.5 text-left text-sm font-medium ${
              active === item.key ? "bg-primary text-white" : "text-[#93A5C2] hover:bg-navy-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col gap-2.5 rounded-2xl bg-[#122A4D] p-4">
        <div className="text-sm font-semibold text-white">Live data, not a mock</div>
        <p className="m-0 text-xs leading-relaxed text-[#9FB1CE]">
          Every number here comes from a real source (git, GitHub, Anthropic, Jira, Confluence) or is clearly marked
          as not connected yet.
        </p>
      </div>
    </div>
  );
}
