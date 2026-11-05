# Developer Dashboard — live, real-data implementation

A working build of the "Parishodh | Developer Dashboard" mockup
(`apps/dev-dashboard-api` + `apps/dev-dashboard-web`), wired to real sources
instead of sample numbers. Every panel either shows live data or a clearly
labeled "not connected" / "coming soon" state — nothing is faked.

## Run it

```bash
pnpm install
pnpm dev:dashboard
```

API on http://localhost:4100, web on http://localhost:5180 (proxies `/api`
to the API). Both are also wired into `.claude/launch.json` for the
in-app browser preview.

## What's live, and where the data comes from

| Panel | Source | Needs |
| --- | --- | --- |
| Commits, lines changed | `git log` on this checkout | nothing — works out of the box |
| PRs authored, reviews given, open PRs, recent activity | GitHub REST API (`/search/issues`, `/user`) for the `origin` remote | `GITHUB_TOKEN`, or falls back to `gh auth token` (already satisfied here — `gh` is logged in as `uxaanurag5`) |
| AI Usage & Cost by Model | Anthropic's Usage & Cost Reporting API (`/v1/organizations/usage_report/messages`, `/cost_report`) | `ANTHROPIC_ADMIN_API_KEY` — an **Admin** API key from console.anthropic.com (Settings → Admin API keys), with the Usage & Cost Reporting scope. This is an org-level secret; set it only in `apps/dev-dashboard-api/.env`, never in the browser. |
| Test Coverage | `coverage-summary.json` from `apps/api/coverage` / `apps/web/coverage` | run `pnpm test -- --coverage` in either app first |
| Jira (assigned issues) | Jira Cloud REST API v3 | configure from the dashboard's **Integrations & Settings** page (Base URL, email, API token) |
| Confluence (authored pages) | Confluence Cloud REST API | same, from **Integrations & Settings** |
| Cowork Activity (Claude.ai documents / session activity) | — | not available: there's no public API for this today, so the panel stays a labeled placeholder instead of guessing |

## Credentials

- **Jira / Confluence**: entered on the Settings page, tested against the
  real API on save, and stored in `apps/dev-dashboard-api/.data/integrations.json`
  — local to this machine, gitignored, never sent anywhere but your own
  Atlassian site. Env-var equivalents (`JIRA_BASE_URL`/`JIRA_EMAIL`/`JIRA_API_TOKEN`,
  same for Confluence) work too, see `.env.example`.
- **Claude / GitHub**: server-only env vars (`ANTHROPIC_ADMIN_API_KEY`,
  `GITHUB_TOKEN`) — these are organization-wide secrets, so there's
  intentionally no browser-facing form for them.

Copy `.env.example` to `.env` in this folder and fill in what you have.
