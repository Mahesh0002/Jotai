/**
 * integrations-store.ts
 * Lightweight localStorage-backed integration state.
 * Stores tokens and connection status for Spotify & GitHub.
 * Uses React state + localStorage — no external state lib needed.
 */

import { BACKEND_API_URL } from "@/lib/config";
import { preferencesApi } from "@/lib/api";

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix ms
  clientId: string;
};

export type GitHubConnection = {
  token: string;
  type: "pat" | "oauth";
  login: string;
  name: string;
  avatarUrl: string;
  publicRepos: number;
};

export type IntegrationsState = {
  spotify: SpotifyTokens | null;
  github: GitHubConnection | null;
};

const STORAGE_KEY = "jotai_integrations_v1";

function load(): IntegrationsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { spotify: null, github: null };
    return JSON.parse(raw);
  } catch {
    return { spotify: null, github: null };
  }
}

function save(state: IntegrationsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

// ─── Spotify helpers ─────────────────────────────────────────────────────────

export function getSpotifyTokens(): SpotifyTokens | null {
  return load().spotify;
}

export function setSpotifyTokens(tokens: SpotifyTokens) {
  const state = load();
  state.spotify = tokens;
  save(state);
  syncIntegrationFlag("spotify", true);
}

export function clearSpotifyTokens() {
  const state = load();
  state.spotify = null;
  save(state);
  syncIntegrationFlag("spotify", false);
}

function syncIntegrationFlag(key: "spotify" | "github", connected: boolean) {
  const integrations = key === "spotify" ? { spotify: connected } : { github: connected };
  preferencesApi.update({ integrations }).catch(() => {
    // Preference bridge is best-effort; local connection state still works.
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jotai-invalidate", { detail: ["preferences"] }));
  }
}

export function isSpotifyConnected(): boolean {
  const tokens = getSpotifyTokens();
  if (!tokens) return false;
  // Consider connected if token is not expired (or within 60s)
  return tokens.expiresAt > Date.now() + 60_000;
}

/** Returns a valid access token, refreshing if needed */
export async function getValidSpotifyToken(): Promise<string | null> {
  const tokens = getSpotifyTokens();
  if (!tokens) return null;

  // If still valid, return it
  if (tokens.expiresAt > Date.now() + 60_000) return tokens.accessToken;

  // Try to refresh
  try {
    const res = await fetch(`${BACKEND_API_URL}/integrations/spotify/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: tokens.refreshToken,
        clientId: tokens.clientId,
      }),
    });
    const data = await res.json();
    if (data.success && data.data.access_token) {
      const newTokens: SpotifyTokens = {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token || tokens.refreshToken,
        expiresAt: Date.now() + data.data.expires_in * 1000,
        clientId: tokens.clientId,
      };
      setSpotifyTokens(newTokens);
      return newTokens.accessToken;
    }
  } catch {
    /* ignore */
  }

  // Refresh failed — clear
  clearSpotifyTokens();
  return null;
}

// ─── GitHub helpers ───────────────────────────────────────────────────────────

export function getGitHubConnection(): GitHubConnection | null {
  return load().github;
}

export function setGitHubConnection(conn: GitHubConnection) {
  const state = load();
  state.github = conn;
  save(state);
  syncIntegrationFlag("github", true);
}

export function clearGitHubConnection() {
  const state = load();
  state.github = null;
  save(state);
  syncIntegrationFlag("github", false);
}

export function isGitHubConnected(): boolean {
  return getGitHubConnection() !== null;
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

/** Generate a cryptographically random PKCE code verifier */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Derive the PKCE code challenge from the verifier */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Build the Spotify auth URL for PKCE */
export async function buildSpotifyAuthUrl(
  clientId: string,
  redirectUri: string,
): Promise<{ url: string; codeVerifier: string }> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-recently-played",
    "playlist-read-private",
    "playlist-read-collaborative",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  return {
    url: `https://accounts.spotify.com/authorize?${params.toString()}`,
    codeVerifier: verifier,
  };
}

// Store the code verifier temporarily during OAuth flow
export function storeCodeVerifier(verifier: string) {
  sessionStorage.setItem("spotify_pkce_verifier", verifier);
}

export function consumeCodeVerifier(): string | null {
  const v = sessionStorage.getItem("spotify_pkce_verifier");
  sessionStorage.removeItem("spotify_pkce_verifier");
  return v;
}
