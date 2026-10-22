import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TestCallResponse, TrainerScenarioSummary } from "@parishodh/shared";
import { api } from "../../lib/api";

export default function ScenariosTab() {
  const queryClient = useQueryClient();
  const [brief, setBrief] = useState("");
  const [product, setProduct] = useState("");

  const scenariosQuery = useQuery({
    queryKey: ["trainer-scenarios"],
    queryFn: () => api.get<TrainerScenarioSummary[]>("/api/trainer/scenarios"),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<TrainerScenarioSummary>("/api/trainer/scenarios", {
        brief,
        product: product.trim() || undefined,
      }),
    onSuccess: () => {
      setBrief("");
      setProduct("");
      void queryClient.invalidateQueries({ queryKey: ["trainer-scenarios"] });
    },
  });

  const testCallMutation = useMutation({
    mutationFn: (scenarioId: string) =>
      api.post<TestCallResponse>(`/api/trainer/scenarios/${scenarioId}/test-call`),
    onSuccess: (data) => window.open(`/simulation/${data.sessionId}`, "_blank"),
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Generate a scenario with AI</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Product (optional)
            </label>
            <input
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder="e.g. Hyundai Creta"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Brief
            </label>
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              rows={3}
              placeholder={"A customer calls for a test-drive follow-up after visiting the showroom last week…"}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={!brief.trim() || generateMutation.isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-50"
          >
            {generateMutation.isPending ? "Generating…" : "Generate with AI"}
          </button>
          {generateMutation.isError && (
            <p className="text-sm text-red-600">Could not generate the scenario. Try again.</p>
          )}
          {generateMutation.isSuccess && (
            <p className="text-sm text-green">
              Created &ldquo;{generateMutation.data.title}&rdquo;.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Scenarios</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenariosQuery.data?.map((scenario) => (
            <div key={scenario.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <span className="mb-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                {scenario.mode}
              </span>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">{scenario.title}</h3>
              <p className="mb-4 text-xs text-slate-500">{scenario.product}</p>
              <button
                onClick={() => testCallMutation.mutate(scenario.id)}
                disabled={testCallMutation.isPending}
                className="text-xs font-semibold text-primary disabled:opacity-50"
              >
                Test call &rarr;
              </button>
            </div>
          ))}
          {scenariosQuery.data?.length === 0 && (
            <p className="text-sm text-slate-400">No scenarios yet &mdash; generate one above.</p>
          )}
        </div>
      </section>
    </div>
  );
}
