import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AssignScenarioResponse, TrainerLearner, TrainerScenarioSummary } from "@parishodh/shared";
import { api } from "../../lib/api";

export default function AssignTab() {
  const [scenarioId, setScenarioId] = useState("");
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [teamFilter, setTeamFilter] = useState("");
  const [dueDate, setDueDate] = useState("");

  const scenariosQuery = useQuery({
    queryKey: ["trainer-scenarios"],
    queryFn: () => api.get<TrainerScenarioSummary[]>("/api/trainer/scenarios"),
  });
  const learnersQuery = useQuery({
    queryKey: ["trainer-learners"],
    queryFn: () => api.get<TrainerLearner[]>("/api/trainer/learners"),
  });

  const filteredLearners = useMemo(() => {
    const learners = learnersQuery.data ?? [];
    if (!teamFilter.trim()) return learners;
    return learners.filter((learner) => learner.team?.toLowerCase().includes(teamFilter.toLowerCase()));
  }, [learnersQuery.data, teamFilter]);

  const assignMutation = useMutation({
    mutationFn: () =>
      api.post<AssignScenarioResponse>("/api/trainer/assignments", {
        scenarioId,
        learnerIds: [...selectedLearners],
        dueAt: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    onSuccess: () => setSelectedLearners(new Set()),
  });

  function toggleLearner(id: string) {
    setSelectedLearners((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canAssign = Boolean(scenarioId) && selectedLearners.size > 0 && !assignMutation.isPending;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Scenario
        </label>
        <select
          value={scenarioId}
          onChange={(event) => setScenarioId(event.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">{"Select a scenario…"}</option>
          {scenariosQuery.data?.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Due date (optional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Learners
          </label>
          <input
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            placeholder={"Filter by team…"}
            className="w-48 rounded-lg border border-border px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {filteredLearners.map((learner) => (
            <label
              key={learner.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-panel"
            >
              <input
                type="checkbox"
                checked={selectedLearners.has(learner.id)}
                onChange={() => toggleLearner(learner.id)}
              />
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: learner.avatarColor }}
              >
                {learner.avatarInitials}
              </span>
              <span className="font-medium text-slate-900">{learner.name}</span>
              <span className="text-xs text-slate-400">{learner.team}</span>
            </label>
          ))}
          {filteredLearners.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-slate-400">No learners match.</p>
          )}
        </div>
      </div>

      <button
        onClick={() => assignMutation.mutate()}
        disabled={!canAssign}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-50"
      >
        {assignMutation.isPending
          ? "Assigning…"
          : `Assign to ${selectedLearners.size || ""} learner${selectedLearners.size === 1 ? "" : "s"}`}
      </button>
      {assignMutation.isSuccess && (
        <p className="text-sm text-green">Assigned to {assignMutation.data.created} learner(s).</p>
      )}
    </div>
  );
}
