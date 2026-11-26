import { useState, useEffect, useCallback } from "react";
import { BACKEND_API_URL, RUNNER_API_URL } from "@/lib/config";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  ExternalLink,
  RefreshCw,
  Loader2,
  Unlink,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  buildSpotifyAuthUrl,
  storeCodeVerifier,
  consumeCodeVerifier,
  getSpotifyTokens,
  setSpotifyTokens,
  clearSpotifyTokens,
  getValidSpotifyToken,
  isSpotifyConnected,
  type SpotifyTokens,
} from "@/lib/integrations-store";
import { toast } from "sonner";

const API = `${BACKEND_API_URL}/integrations`;
// Spotify Client ID — set in .env as VITE_SPOTIFY_CLIENT_ID
const CLIENT_ID = (import.meta.env as any).VITE_SPOTIFY_CLIENT_ID || "";
// Spotify requires a loopback IP (not 'localhost') for the redirect URI
const REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname}:${window.location.port}/integrations`
    : "http://127.0.0.1:5173/integrations";

type NowPlaying = {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
  trackUrl: string;
};

type Playlist = {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  external_urls: { spotify: string };
};

async function spotifyFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getValidSpotifyToken();
  if (!token) throw new Error("No valid Spotify token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "x-spotify-token": token,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

function msToTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SpotifyPanel({
  onConnectionChange,
}: {
  onConnectionChange?: (connected: boolean) => void;
}) {
  const [connected, setConnected] = useState(isSpotifyConnected());
  const [loading, setLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string;
    images: { url: string }[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"now" | "playlists">("now");
  const [syncing, setSyncing] = useState(false);

  // Handle OAuth callback (code in URL)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || state !== "spotify_oauth") return;

    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);

    const verifier = consumeCodeVerifier();
    if (!verifier) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/spotify/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            codeVerifier: verifier,
            redirectUri: REDIRECT_URI,
            clientId: CLIENT_ID,
          }),
        });
        const data = await res.json();
        if (data.success && data.data.access_token) {
          const tokens: SpotifyTokens = {
            accessToken: data.data.access_token,
            refreshToken: data.data.refresh_token,
            expiresAt: Date.now() + data.data.expires_in * 1000,
            clientId: CLIENT_ID,
          };
          setSpotifyTokens(tokens);
          setConnected(true);
          onConnectionChange?.(true);
          toast.success("Spotify connected!");
        } else {
          toast.error("Spotify connection failed");
        }
      } catch {
        toast.error("Failed to connect Spotify");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const connect = async () => {
    if (!CLIENT_ID) {
      toast.error("Add VITE_SPOTIFY_CLIENT_ID to your .env file to connect Spotify");
      return;
    }
    setLoading(true);
    try {
      const { url, codeVerifier } = await buildSpotifyAuthUrl(CLIENT_ID, REDIRECT_URI);
      storeCodeVerifier(codeVerifier);
      // Append state param
      window.location.href = url + "&state=spotify_oauth";
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    clearSpotifyTokens();
    setConnected(false);
    setNowPlaying(null);
    setProfile(null);
    setPlaylists([]);
    onConnectionChange?.(false);
    toast.success("Spotify disconnected");
  };

  const fetchNowPlaying = useCallback(async () => {
    if (!connected) return;
    try {
      const data = await spotifyFetch("/spotify/now-playing");
      if (data.success && data.data) {
        const item = data.data.item;
        setNowPlaying({
          isPlaying: data.data.is_playing,
          trackName: item.name,
          artistName: item.artists.map((a: any) => a.name).join(", "),
          albumName: item.album.name,
          albumArt: item.album.images[0]?.url || "",
          progressMs: data.data.progress_ms,
          durationMs: item.duration_ms,
          trackUrl: item.external_urls.spotify,
        });
      } else {
        setNowPlaying(null);
      }
    } catch {
      /* ignore */
    }
  }, [connected]);

  const fetchProfile = useCallback(async () => {
    if (!connected) return;
    try {
      const data = await spotifyFetch("/spotify/profile");
      if (data.success) setProfile(data.data);
    } catch {
      /* ignore */
    }
  }, [connected]);

  const fetchPlaylists = useCallback(async () => {
    if (!connected) return;
    try {
      const [fpData, myData] = await Promise.all([
        spotifyFetch("/spotify/focus-playlists"),
        spotifyFetch("/spotify/playlists"),
      ]);
      const fp = fpData.success ? fpData.data : [];
      const my = myData.success ? myData.data : [];
      // Merge, de-dupe by id
      const merged = [...fp, ...my];
      const seen = new Set();
      setPlaylists(
        merged
          .filter((p: any) => {
            if (!p || seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          })
          .slice(0, 10),
      );
    } catch {
      /* ignore */
    }
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    fetchProfile();
    fetchNowPlaying();
    fetchPlaylists();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [connected, fetchNowPlaying, fetchProfile, fetchPlaylists]);

  const control = async (action: string, payload: Record<string, any> = {}) => {
    try {
      await spotifyFetch("/spotify/playback", {
        method: "POST",
        body: JSON.stringify({ action, ...payload }),
      });
      setTimeout(fetchNowPlaying, 500);
    } catch {
      toast.error("Playback control failed");
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    await fetchNowPlaying();
    await fetchPlaylists();
    setSyncing(false);
    toast.success("Spotify synced");
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <Music className="h-10 w-10 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect Spotify</h3>
          <p className="text-sm text-zinc-400 max-w-xs">
            Link your Spotify account to control playback, see what's playing, and get focus
            playlists — all from Jōtai.
          </p>
        </div>
        {!CLIENT_ID && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[11px] text-amber-400 max-w-xs text-left">
            Add <code className="bg-zinc-800 px-1 rounded">VITE_SPOTIFY_CLIENT_ID=your_id</code> to{" "}
            <code className="bg-zinc-800 px-1 rounded">client/.env</code>, then add{" "}
            <code className="bg-zinc-800 px-1 rounded">http://127.0.0.1:5173/integrations</code> as
            a Redirect URI in your Spotify Developer App. Use <strong>127.0.0.1</strong>, not
            localhost.
          </div>
        )}
        <Button
          onClick={connect}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-2.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Music className="h-4 w-4 mr-2" />
          )}
          Connect with Spotify
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profile?.images?.[0]?.url ? (
            <img
              src={profile.images[0].url}
              className="h-9 w-9 rounded-full object-cover"
              alt="Spotify avatar"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Music className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{profile?.display_name || "Spotify"}</p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500"
            onClick={syncNow}
            disabled={syncing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-red-400"
            onClick={disconnect}
          >
            <Unlink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800 pb-0">
        {(["now", "playlists"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              activeTab === t
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "now" ? "Now Playing" : "Playlists"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "now" && (
          <motion.div
            key="now"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {nowPlaying ? (
              <div className="flex flex-col gap-4">
                {/* Album art + track info */}
                <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <img
                    src={nowPlaying.albumArt}
                    alt={nowPlaying.albumName}
                    className="h-16 w-16 rounded-lg object-cover shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  />
                  <div className="flex-1 min-w-0">
                    <a
                      href={nowPlaying.trackUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-1"
                    >
                      <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {nowPlaying.trackName}
                      </p>
                      <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-emerald-400 shrink-0" />
                    </a>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {nowPlaying.artistName}
                    </p>
                    <p className="text-[10px] text-zinc-600 truncate">{nowPlaying.albumName}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(nowPlaying.progressMs / nowPlaying.durationMs) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{msToTime(nowPlaying.progressMs)}</span>
                    <span>{msToTime(nowPlaying.durationMs)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-zinc-400 hover:text-white"
                    onClick={() => control("previous")}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    className="h-11 w-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    onClick={() => control(nowPlaying.isPlaying ? "pause" : "play")}
                  >
                    {nowPlaying.isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-zinc-400 hover:text-white"
                    onClick={() => control("next")}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <Music className="h-10 w-10 text-zinc-700" />
                <p className="text-sm text-zinc-500">Nothing playing right now</p>
                <p className="text-[11px] text-zinc-600">Open Spotify and start playing music</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "playlists" && (
          <motion.div
            key="playlists"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {playlists.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2 text-center">
                  <List className="h-8 w-8 text-zinc-700" />
                  <p className="text-sm text-zinc-500">No playlists found</p>
                </div>
              ) : (
                playlists.map((pl) => (
                  <a
                    key={pl.id}
                    href={pl.external_urls?.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/60 hover:border-emerald-500/20 transition-all group"
                  >
                    {pl.images?.[0]?.url ? (
                      <img
                        src={pl.images[0].url}
                        className="h-10 w-10 rounded object-cover shrink-0"
                        alt={pl.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                        <Music className="h-4 w-4 text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">
                        {pl.name}
                      </p>
                      <p className="text-[10px] text-zinc-600">{pl.tracks?.total} tracks</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-zinc-700 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
