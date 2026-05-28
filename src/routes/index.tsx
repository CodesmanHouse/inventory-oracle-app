import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDemo } from "@/hooks/useDemo";
import { useState, type FormEvent } from "react";
import { Package, ArrowRight, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in · Stackwise" },
      {
        name: "description",
        content:
          "Sign in to Stackwise · the inventory command center for real-time tracking, smart reorders, and supplier management.",
      },
      { property: "og:title", content: "Sign in · Stackwise" },
      {
        property: "og:description",
        content:
          "Sign in to Stackwise · the inventory command center for modern teams.",
      },
    ],
  }),
});

function LoginPage() {
  const { enterDemoMode } = useDemo();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    enterDemoMode();
    navigate({ to: "/app/dashboard" });
  };

  const handleDemo = () => {
    enterDemoMode();
    navigate({ to: "/app/dashboard" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold tracking-tight">Stackwise</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your inventory command center
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-input bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setError("Password reset is disabled in demo mode.")}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
            >
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemo}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Try demo · no account needed
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Stackwise?{" "}
          <button
            type="button"
            onClick={handleDemo}
            className="font-medium text-primary hover:underline"
          >
            Explore the demo
          </button>
        </p>
      </div>
    </main>
  );
}
