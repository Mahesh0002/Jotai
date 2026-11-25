import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") await authApi.login(email, password);
      else await authApi.register(email, password, username || undefined);
      window.location.assign("/");
    } catch (cause) {
      const axiosError = cause as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      setError(
        axiosError.response?.data?.error ??
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-200">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl">
        <div className="mb-8 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-purple-400">
            <Zap className="size-5 fill-current" />
            <span className="font-display text-lg font-semibold text-white">Jōtai</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-xs text-zinc-500">
            Sign in to sync your goals, habits, and assistant decisions.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "register" ? (
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username (optional)"
              aria-label="Username"
              className="h-10 border-zinc-800 bg-zinc-950 text-sm"
            />
          ) : null}
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            aria-label="Email"
            required
            className="h-10 border-zinc-800 bg-zinc-950 text-sm"
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (8+ characters)"
            aria-label="Password"
            required
            minLength={8}
            className="h-10 border-zinc-800 bg-zinc-950 text-sm"
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <Button
            type="submit"
            className="mt-2 h-10 bg-purple-600 text-sm text-white hover:bg-purple-500"
            disabled={loading}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="mt-6 w-full text-center text-xs text-zinc-500 hover:text-purple-300"
        >
          {mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}
        </button>
      </div>
    </div>
  );
}
