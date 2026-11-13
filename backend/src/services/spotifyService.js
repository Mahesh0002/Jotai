const axios = require('axios');
const config = require('../config');

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';

/**
 * Exchange PKCE auth code for access + refresh tokens.
 * No client_secret needed — PKCE public flow.
 */
const exchangeCode = async ({ code, codeVerifier, redirectUri, clientId }) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await axios.post(
    `${SPOTIFY_ACCOUNTS}/api/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data; // { access_token, refresh_token, expires_in, token_type }
};

/**
 * Refresh an expired access token using the refresh token.
 */
const refreshToken = async ({ refreshToken: token, clientId }) => {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token,
    client_id: clientId,
  });

  const response = await axios.post(
    `${SPOTIFY_ACCOUNTS}/api/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data;
};

/** Helper: build authorized headers */
const headers = (accessToken) => ({ Authorization: `Bearer ${accessToken}` });

/** Get the currently playing track (or null if nothing is playing) */
const getNowPlaying = async (accessToken) => {
  try {
    const res = await axios.get(`${SPOTIFY_API}/me/player/currently-playing`, {
      headers: headers(accessToken),
    });
    if (res.status === 204 || !res.data) return null; // Nothing playing
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) throw new Error('SPOTIFY_UNAUTHORIZED');
    throw err;
  }
};

/** Get playback state (includes device, shuffle, repeat, etc.) */
const getPlaybackState = async (accessToken) => {
  try {
    const res = await axios.get(`${SPOTIFY_API}/me/player`, {
      headers: headers(accessToken),
    });
    if (res.status === 204 || !res.data) return null;
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) throw new Error('SPOTIFY_UNAUTHORIZED');
    throw err;
  }
};

/** Get last N recently played tracks */
const getRecentTracks = async (accessToken, limit = 10) => {
  const res = await axios.get(`${SPOTIFY_API}/me/player/recently-played?limit=${limit}`, {
    headers: headers(accessToken),
  });
  return res.data.items; // Array of { track, played_at, context }
};

/** Search for focus/study playlists */
const getFocusPlaylists = async (accessToken) => {
  const queries = ['focus', 'deep work', 'lofi study', 'concentration'];
  const results = [];

  for (const q of queries.slice(0, 2)) {
    try {
      const res = await axios.get(
        `${SPOTIFY_API}/search?q=${encodeURIComponent(q)}&type=playlist&limit=3`,
        { headers: headers(accessToken) }
      );
      const playlists = res.data.playlists?.items || [];
      results.push(...playlists.filter(Boolean));
    } catch (_) {}
  }

  // De-dupe by id
  const seen = new Set();
  return results.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, 6);
};

/** Get user's saved/followed playlists */
const getUserPlaylists = async (accessToken, limit = 20) => {
  const res = await axios.get(`${SPOTIFY_API}/me/playlists?limit=${limit}`, {
    headers: headers(accessToken),
  });
  return res.data.items;
};

/** Get user profile */
const getUserProfile = async (accessToken) => {
  const res = await axios.get(`${SPOTIFY_API}/me`, {
    headers: headers(accessToken),
  });
  return res.data;
};

/**
 * Control playback.
 * action: 'play' | 'pause' | 'next' | 'previous' | 'seek'
 */
const controlPlayback = async (accessToken, action, payload = {}) => {
  const base = `${SPOTIFY_API}/me/player`;
  switch (action) {
    case 'play':
      await axios.put(`${base}/play`, payload, { headers: headers(accessToken) });
      break;
    case 'pause':
      await axios.put(`${base}/pause`, {}, { headers: headers(accessToken) });
      break;
    case 'next':
      await axios.post(`${base}/next`, {}, { headers: headers(accessToken) });
      break;
    case 'previous':
      await axios.post(`${base}/previous`, {}, { headers: headers(accessToken) });
      break;
    case 'seek':
      await axios.put(`${base}/seek?position_ms=${payload.positionMs}`, {}, {
        headers: headers(accessToken),
      });
      break;
    case 'volume':
      await axios.put(`${base}/volume?volume_percent=${payload.volume}`, {}, {
        headers: headers(accessToken),
      });
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
  return { success: true };
};

module.exports = {
  exchangeCode,
  refreshToken,
  getNowPlaying,
  getPlaybackState,
  getRecentTracks,
  getFocusPlaylists,
  getUserPlaylists,
  getUserProfile,
  controlPlayback,
};
