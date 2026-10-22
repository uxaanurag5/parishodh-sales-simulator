import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { LoginResponse } from "@parishodh/shared";
import { api, ApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { homePathForRole } from "../lib/roleHome";
import Logo from "../components/Logo";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("aarav@demo.in");
  const [password, setPassword] = useState("demo1234");

  const mutation = useMutation({
    mutationFn: () => api.post<LoginResponse>("/api/auth/login", { email, password }),
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate(homePathForRole(data.user.role), { replace: true });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 85% 90%, rgba(27,182,201,0.25), transparent 45%), radial-gradient(circle at 10% 10%, rgba(11,74,162,0.35), transparent 45%)",
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Sign in to continue your learning journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {mutation.error instanceof ApiError ? mutation.error.message : "Login failed"}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-60"
          >
            {mutation.isPending ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo: aarav@demo.in / demo1234 (learner) &middot; trainer@demo.in / demo1234 (trainer)
        </p>
      </div>
    </div>
  );
}
