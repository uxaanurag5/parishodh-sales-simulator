import { useState } from "react";
import type { Credential, IntegrationStatus } from "../api/client";

interface CredentialFormProps {
  title: string;
  helpText: string;
  tokenHelpUrl: string;
  status: IntegrationStatus | undefined;
  saving: boolean;
  lastResult?: { ok: boolean; message: string };
  onSave: (credential: Credential) => void;
  onClear: () => void;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "your Atlassian site";
  }
}

export function CredentialForm({ title, helpText, tokenHelpUrl, status, saving, lastResult, onSave, onClear }: CredentialFormProps) {
  const [baseUrl, setBaseUrl] = useState(status?.baseUrl ?? "https://your-domain.atlassian.net");
  const [email, setEmail] = useState(status?.email ?? "");
  const [apiToken, setApiToken] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-[15px] font-bold text-slate-900">{title}</h3>
        <span
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: status?.configured ? "#16A34A" : "#94A3B8" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: status?.configured ? "#16A34A" : "#CBD5E1" }}
          />
          {status?.configured ? "Connected" : "Not connected"}
        </span>
      </div>
      <p className="m-0 text-xs text-slate-500">{helpText}</p>

      <form
        className="flex flex-col gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ baseUrl, email, apiToken });
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Base URL
          <input
            required
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://your-domain.atlassian.net"
            className="rounded-[9px] border border-border bg-[#F6F8FB] px-2.5 py-2 text-[13px] font-normal text-slate-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          Account email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-[9px] border border-border bg-[#F6F8FB] px-2.5 py-2 text-[13px] font-normal text-slate-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
          API token
          <input
            required
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder={status?.configured ? "•••••••• (enter to replace)" : "paste your API token"}
            className="rounded-[9px] border border-border bg-[#F6F8FB] px-2.5 py-2 text-[13px] font-normal text-slate-700"
          />
          <a href={tokenHelpUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary">
            Where do I get this token?
          </a>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Testing connection…" : "Save & test connection"}
          </button>
          {status?.configured && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-[9px] border border-border bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600"
            >
              Disconnect
            </button>
          )}
        </div>
        {lastResult && (
          <p className="m-0 text-xs" style={{ color: lastResult.ok ? "#16A34A" : "#DC2626" }}>
            {lastResult.message}
          </p>
        )}
      </form>
      <p className="m-0 text-[11px] text-slate-400">
        Saved to <code>apps/dev-dashboard-api/.data/integrations.json</code> on this machine only — never committed
        to git, never sent anywhere but {hostOf(baseUrl)}.
      </p>
    </div>
  );
}
