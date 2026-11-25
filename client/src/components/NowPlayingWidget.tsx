import { useState, useEffect } from "react";
import { BACKEND_API_URL, RUNNER_API_URL } from "@/lib/config";
import { Music, Play, Pause, SkipForward } from "lucide-react";
import { getValidSpotifyToken, isSpotifyConnected } from "@/lib/integrations-store";
import { Link } from "@tanstack/react-router";

const API = `${BACKEND_API_URL}/integrations`;

type MiniTrack = {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
};

async function fetchNowPlaying(): Promise<MiniTrack | null> {
  const token = await getValidSpotifyToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/spotify/now-playing`, {
      headers: { "x-spotify-token": token },
    });
    const data = await res.json();
    if (!data.success || !data.data) return null;
    const item = data.data.item;
    return {
      isPlaying: data.data.is_playing,
      trackName: item.name,
      artistName: item.artists.map((a: any) => a.name).join(", "),
      albumArt: item.album.images?.[0]?.url || "",
      progressMs: data.data.progress_ms,
      durationMs: item.duration_ms,
    };
  } catch {
    return null;
  }
}

async function controlPlayback(action: "play" | "pause" | "next", token: string) {
  await fetch(`${API}/spotify/playback`, {
    method: "POST",
    headers: { "x-spotify-token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

export function NowPlayingWidget() {
  const [track, setTrack] = useState<MiniTrack | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isSpotifyConnected()) return;
    setVisible(true);

    const poll = async () => {
      const t = await fetchNowPlaying();
      setTrack(t);
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleControl = async (action: "play" | "pause" | "next") => {
    const token = await getValidSpotifyToken();
    if (!token) return;
    await controlPlayback(action, token);
    setTimeout(async () => {
      const t = await fetchNowPlaying();
      setTrack(t);
    }, 600);
  };

  if (!visible || !track) return null;

  const progress = (track.progressMs / track.durationMs) * 100;

  return (
    <Link
      to="/integrations"
      className="block rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 hover:bg-emerald-500/10 transition-all group"
    >
      <div className="flex items-center gap-2.5">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt="album"
            className="h-9 w-9 rounded-md object-cover shadow-md shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
            <Music className="h-4 w-4 text-zinc-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-zinc-200 truncate leading-tight">{track.trackName}</p>
          <p className="text-[10px] text-zinc-500 truncate">{track.artistName}</p>
        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.preventDefault()}
        >
          <button
            onClick={() => handleControl(track.isPlaying ? "pause" : "play")}
            className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            {track.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            onClick={() => handleControl("next")}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <SkipForward className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-2.5 h-0.5 w-full rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Link>
  );
}
