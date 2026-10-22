import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Logo from "../components/Logo";
import ScenariosTab from "../components/trainer/ScenariosTab";
import AssignTab from "../components/trainer/AssignTab";
import ReportsTab from "../components/trainer/ReportsTab";

const TABS = ["Scenarios", "Assign", "Reports"] as const;
type Tab = (typeof TABS)[number];

export default function TrainerPage() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("Scenarios");

  if (!user) return null;
  if (user.role === "LEARNER") return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-panel">
      <header className="flex items-center justify-between border-b border-border bg-white px-8 py-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tab === t ? "bg-blue-50 text-primary" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.avatarInitials}
          </div>
          <div className="text-sm">
            <div className="font-semibold text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">{user.team ?? "Trainer"}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-8">
        {tab === "Scenarios" && <ScenariosTab />}
        {tab === "Assign" && <AssignTab />}
        {tab === "Reports" && <ReportsTab />}
      </main>
    </div>
  );
}
