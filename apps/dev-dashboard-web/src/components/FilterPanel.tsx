import { useGitBranches } from "../api/client";

interface FilterPanelProps {
  branch: string;
  onBranchChange: (branch: string) => void;
}

export function FilterPanel({ branch, onBranchChange }: FilterPanelProps) {
  const branches = useGitBranches();
  const options = branches.data?.branches ?? [];
  const current = options.find((b) => b.isCurrent)?.name;

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-white p-5">
      <h2 className="m-0 text-[15px] font-bold text-slate-900">Branch</h2>
      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Branch</span>
        <select
          value={branch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="rounded-[9px] border border-border bg-[#F6F8FB] px-2.5 py-2 text-[13px] text-slate-700"
        >
          <option value="">{current ? `Current (${current})` : "Current branch"}</option>
          {options.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
              {b.isCurrent ? " (current)" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="m-0 text-[11px] text-slate-400">
        Commits, PR and review counts are scoped to this branch — from this checkout's real git history and GitHub.
      </p>
    </div>
  );
}
