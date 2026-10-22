import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SimulationPage from "./pages/SimulationPage";
import ResultsPage from "./pages/ResultsPage";
import TranscriptReplayPage from "./pages/TranscriptReplayPage";
import TrainerPage from "./pages/TrainerPage";
import AppShell from "./components/AppShell";
import RequireAuth from "./routes/RequireAuth";
import { useAuthStore } from "./store/authStore";
import { homePathForRole } from "./lib/roleHome";

function RoleHome() {
  const user = useAuthStore((state) => state.user);
  return <Navigate to={homePathForRole(user?.role ?? "LEARNER")} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="/trainer" element={<TrainerPage />} />
        <Route path="/simulation/:sessionId" element={<SimulationPage />} />
        <Route path="/simulation/:sessionId/results" element={<ResultsPage />} />
        <Route path="/simulation/:sessionId/replay" element={<TranscriptReplayPage />} />
        <Route path="*" element={<RoleHome />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
