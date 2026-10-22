import Logo from "./Logo";

const NAV_ITEMS = [
  { label: "My Learning", active: true },
  { label: "Courses" },
  { label: "Assessments" },
  { label: "Live Tasks" },
  { label: "Certificates" },
  { label: "Progress" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-white px-4 py-6">
      <div className="mb-8 px-2">
        <Logo />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <span
            key={item.label}
            className={
              item.active
                ? "rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-primary"
                : "cursor-default rounded-lg px-3 py-2 text-sm font-medium text-slate-400"
            }
          >
            {item.label}
          </span>
        ))}
      </nav>
    </aside>
  );
}
