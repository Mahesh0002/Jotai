import { useState, useEffect, useCallback } from "react";
import { BACKEND_API_URL, RUNNER_API_URL } from "@/lib/config";
import { Github, GitCommit, GitPullRequest, Book, ExternalLink, RefreshCw, Loader2, Check, X, Unlink, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGitHubConnection,
  setGitHubConnection,
  clearGitHubConnection,
  isGitHubConnected,
  type GitHubConnection,
} from "@/lib/integrations-store";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = `${BACKEND_API_URL}/integrations`;

type Repo = { id: number; name: string; full_name: string; language: string | null; stargazers_count: number; pushed_at: string; html_url: string; private: boolean };
type Commit = { sha: string; commit: { message: string; author: { date: string } }; repository: { full_name: string; html_url: string }; html_url: string };
type PR = { id: number; title: string; html_url: string; repository_url: string; created_at: string; labels: { name: string; color: string }[] };
type ActivityStats = { commitsThisWeek: number; prsThisWeek: number; dailyCommits: { day: string; count: number }[] };

async function ghFetch(path: string, token: string, type: "pat" | "oauth"): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: { "x-github-token": token, "Content-Type": "application/json" },
  });
  return res.json();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

const TABS = ["overview", "commits", "prs", "repos"] as const;
type Tab = typeof TABS[number];

export function GitHubPanel({ onConnectionChange }: { onConnectionChange?: (connected: boolean) => void }) {
  const [connection, setConnection] = useState<GitHubConnection | null>(getGitHubConnection);
  const [connected, setConnected] = useState(isGitHubConnected());

  // PAT input state
  const [patInput, setPatInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState("");

  // Data
  const [profile, setProfile] = useState<GitHubConnection | null>(connection);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [activity, setActivity] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const loadData = useCallback(async (conn: GitHubConnection) => {
    setLoading(true);
    try {
      const [profileRes, reposRes, commitsRes, prsRes, activityRes] = await Promise.all([
        ghFetch("/github/profile", conn.token, conn.type),
        ghFetch("/github/repos", conn.token, conn.type),
        ghFetch(`/github/commits?login=${conn.login}&type=${conn.type}`, conn.token, conn.type),
        ghFetch(`/github/prs?login=${conn.login}&type=${conn.type}`, conn.token, conn.type),
        ghFetch(`/github/activity?login=${conn.login}&type=${conn.type}`, conn.token, conn.type),
      ]);
      if (reposRes.success) setRepos(reposRes.data);
      if (commitsRes.success) setCommits(commitsRes.data);
      if (prsRes.success) setPrs(prsRes.data);
      if (activityRes.success) setActivity(activityRes.data);
    } catch {
      toast.error("Failed to load GitHub data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected && connection) loadData(connection);
  }, [connected, connection, loadData]);

  const testAndConnect = async () => {
    if (!patInput.trim()) return;
    setTesting(true);
    setTestError("");
    try {
      const res = await fetch(`${API}/github/profile`, {
        headers: { "x-github-token": patInput.trim(), "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Invalid token");

      const conn: GitHubConnection = {
        token: patInput.trim(),
        type: "pat",
        login: data.data.login,
        name: data.data.name || data.data.login,
        avatarUrl: data.data.avatar_url,
        publicRepos: data.data.public_repos,
      };
      setGitHubConnection(conn);
      setConnection(conn);
      setProfile(conn);
      setConnected(true);
      onConnectionChange?.(true);
      toast.success(`Connected as @${conn.login}`);
      loadData(conn);
    } catch (err: any) {
      setTestError(err.message || "Invalid token — check your PAT and scopes");
    } finally {
      setTesting(false);
    }
  };

  const disconnect = () => {
    clearGitHubConnection();
    setConnection(null);
    setConnected(false);
    setProfile(null);
    setRepos([]);
    setCommits([]);
    setPrs([]);
    setActivity(null);
    onConnectionChange?.(false);
    toast.success("GitHub disconnected");
  };

  const syncNow = async () => {
    if (!connection) return;
    setSyncing(true);
    await loadData(connection);
    setSyncing(false);
    toast.success("GitHub synced");
  };

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100/5 border border-zinc-700/50 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
            <Github className="h-10 w-10 text-zinc-200" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Connect GitHub</h3>
            <p className="text-sm text-zinc-400 max-w-sm">
              See your commits, open PRs, and repo activity — live, right inside Jōtai.
            </p>
          </div>
        </div>

        {/* PAT input */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Key className="h-4 w-4 text-zinc-400" />
            <h4 className="text-sm font-semibold text-white">Personal Access Token</h4>
          </div>
          <p className="text-[11px] text-zinc-500">
            Create a PAT at{" "}
            <a href="https://github.com/settings/tokens/new?scopes=repo,user,read:org" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
              github.com/settings/tokens
            </a>{" "}
            with <code className="bg-zinc-800 px-1 rounded text-zinc-300">repo</code>,{" "}
            <code className="bg-zinc-800 px-1 rounded text-zinc-300">user</code>,{" "}
            <code className="bg-zinc-800 px-1 rounded text-zinc-300">read:org</code> scopes.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && testAndConnect()}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="flex-1 h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none font-mono"
            />
            <Button
              onClick={testAndConnect}
              disabled={testing || !patInput.trim()}
              className="h-9 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold px-4 shrink-0"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect"}
            </Button>
          </div>
          {testError && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <X className="h-3 w-3" /> {testError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Connected ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-700" alt="GitHub avatar" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-200">
              <Github className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{profile?.name || profile?.login}</p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">@{profile?.login} · {profile?.publicRepos} repos</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500" onClick={syncNow} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-400" onClick={disconnect}>
            <Unlink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors capitalize ${
              activeTab === t ? "text-zinc-200 border-b-2 border-zinc-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Commits this week", value: activity?.commitsThisWeek ?? 0, icon: <GitCommit className="h-4 w-4 text-purple-400" /> },
                  { label: "Open PRs", value: prs.length, icon: <GitPullRequest className="h-4 w-4 text-emerald-400" /> },
                  { label: "Active repos", value: repos.length, icon: <Book className="h-4 w-4 text-blue-400" /> },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    {s.icon}
                    <span className="text-xl font-bold text-white mt-1">{s.value}</span>
                    <span className="text-[10px] text-zinc-500">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Daily commit chart */}
              {activity?.dailyCommits && activity.dailyCommits.length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Commits — last 7 days</p>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={activity.dailyCommits} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                      <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: "#a1a1aa" }}
                      />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {activity.dailyCommits.map((_, i) => (
                          <Cell key={i} fill={_ .count > 0 ? "#a78bfa" : "#27272a"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent commits preview */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Recent Commits</p>
                {commits.slice(0, 3).map((c) => (
                  <a key={c.sha} href={c.html_url} target="_blank" rel="noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/60 transition-colors group">
                    <GitCommit className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-zinc-200 truncate group-hover:text-purple-400">{c.commit.message.split("\n")[0]}</p>
                      <p className="text-[10px] text-zinc-600">{c.repository?.full_name} · {timeAgo(c.commit.author.date)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* COMMITS */}
          {activeTab === "commits" && (
            <motion.div key="commits" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {commits.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No commits in the last 7 days</p>
              ) : commits.map((c) => (
                <a key={c.sha} href={c.html_url} target="_blank" rel="noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/60 transition-colors group">
                  <GitCommit className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-zinc-200 truncate group-hover:text-purple-400">{c.commit.message.split("\n")[0]}</p>
                    <p className="text-[10px] text-zinc-600">{c.repository?.full_name} · {timeAgo(c.commit.author.date)}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-zinc-700 group-hover:text-purple-400 shrink-0 mt-0.5" />
                </a>
              ))}
            </motion.div>
          )}

          {/* PULL REQUESTS */}
          {activeTab === "prs" && (
            <motion.div key="prs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {prs.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No open pull requests</p>
              ) : prs.map((pr) => (
                <a key={pr.id} href={pr.html_url} target="_blank" rel="noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/60 transition-colors group">
                  <GitPullRequest className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-zinc-200 group-hover:text-emerald-400 line-clamp-2">{pr.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-600">{pr.repository_url.split("/repos/")[1]} · {timeAgo(pr.created_at)}</span>
                      {pr.labels?.slice(0, 2).map((l) => (
                        <span key={l.name} className="rounded px-1 py-0.5 text-[9px] font-medium" style={{ background: `#${l.color}22`, color: `#${l.color}` }}>{l.name}</span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </motion.div>
          )}

          {/* REPOS */}
          {activeTab === "repos" && (
            <motion.div key="repos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {repos.map((repo) => (
                <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/60 transition-colors group">
                  <Book className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-medium text-zinc-200 truncate group-hover:text-blue-400">{repo.name}</p>
                      {repo.private && <span className="rounded border border-zinc-700 px-1 text-[9px] text-zinc-600">private</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {repo.language && <span className="text-[10px] text-zinc-500">{repo.language}</span>}
                      <span className="text-[10px] text-zinc-600">Pushed {timeAgo(repo.pushed_at)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-600">★ {repo.stargazers_count}</span>
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
