import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-navy-950 p-6">
      <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-[1400px] overflow-hidden rounded-[28px] border border-border bg-white shadow-2xl">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
