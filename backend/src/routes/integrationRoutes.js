const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');
const githubService = require('../services/githubService');
const config = require('../config');

// ─────────────────────────────────────────────
// SPOTIFY
// ─────────────────────────────────────────────

/** POST /integrations/spotify/token
 *  Body: { code, codeVerifier, redirectUri, clientId }
 *  Returns: { access_token, refresh_token, expires_in }
 */
router.post('/spotify/token', async (req, res) => {
  try {
    const { code, codeVerifier, redirectUri, clientId } = req.body;
    if (!code || !codeVerifier || !redirectUri || !clientId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const tokens = await spotifyService.exchangeCode({ code, codeVerifier, redirectUri, clientId });
    res.json({ success: true, data: tokens });
  } catch (err) {
    console.error('Spotify token exchange error:', err.response?.data || err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

/** POST /integrations/spotify/refresh
 *  Body: { refreshToken, clientId }
 */
router.post('/spotify/refresh', async (req, res) => {
  try {
    const { refreshToken, clientId } = req.body;
    const tokens = await spotifyService.refreshToken({ refreshToken, clientId });
    res.json({ success: true, data: tokens });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/** GET /integrations/spotify/now-playing
 *  Header: x-spotify-token: <access_token>
 */
router.get('/spotify/now-playing', async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    if (!accessToken) return res.status(401).json({ success: false, message: 'No token' });
    const data = await spotifyService.getNowPlaying(accessToken);
    res.json({ success: true, data }); // data is null if nothing playing
  } catch (err) {
    if (err.message === 'SPOTIFY_UNAUTHORIZED') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/spotify/state */
router.get('/spotify/state', async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    if (!accessToken) return res.status(401).json({ success: false, message: 'No token' });
    const data = await spotifyService.getPlaybackState(accessToken);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/spotify/recent */
router.get('/spotify/recent', async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    if (!accessToken) return res.status(401).json({ success: false, message: 'No token' });
    const limit = parseInt(req.query.limit) || 10;
    const data = await spotifyService.getRecentTracks(accessToken, limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/spotify/focus-playlists */
router.get('/spotify/focus-playlists', async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    if (!accessToken) return res.status(401).json({ success: false, message: 'No token' });
    const data = await spotifyService.getFocusPlaylists(accessToken);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/spotify/playlists */
router.get('/spotify/playlists', async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    if (!accessToken) return res.status(401).json({ success: false, message: 'No token' });
    const data = await spotifyService.getUserPlaylists(accessToken);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/spotify/profile */
router.get('/spotify/profile', async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    if (!accessToken) return res.status(401).json({ success: false, message: 'No token' });
    const data = await spotifyService.getUserProfile(accessToken);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /integrations/spotify/playback
 *  Body: { action: 'play'|'pause'|'next'|'previous'|'seek'|'volume', ...payload }
 */
router.post('/spotify/playback', async (req, res) => {
  try {
    const accessToken = req.headers['x-spotify-token'];
    if (!accessToken) return res.status(401).json({ success: false, message: 'No token' });
    const { action, ...payload } = req.body;
    const result = await spotifyService.controlPlayback(accessToken, action, payload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GITHUB
// ─────────────────────────────────────────────

/** GET /integrations/github/profile
 *  Header: x-github-token: <PAT or OAuth token>
 *  Query:  type=pat|oauth (default pat)
 */
router.get('/github/profile', async (req, res) => {
  try {
    const token = req.headers['x-github-token'];
    const type = req.query.type || 'pat';
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const data = await githubService.getUserProfile(token, type);
    res.json({ success: true, data });
  } catch (err) {
    const status = err.response?.status === 401 ? 401 : 500;
    res.status(status).json({ success: false, message: err.response?.data?.message || err.message });
  }
});

/** GET /integrations/github/repos */
router.get('/github/repos', async (req, res) => {
  try {
    const token = req.headers['x-github-token'];
    const type = req.query.type || 'pat';
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const data = await githubService.getRepos(token, type);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/github/commits?login=<username> */
router.get('/github/commits', async (req, res) => {
  try {
    const token = req.headers['x-github-token'];
    const type = req.query.type || 'pat';
    const login = req.query.login;
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    if (!login) return res.status(400).json({ success: false, message: 'login required' });
    const data = await githubService.getRecentCommits(token, login, type);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/github/prs?login=<username> */
router.get('/github/prs', async (req, res) => {
  try {
    const token = req.headers['x-github-token'];
    const type = req.query.type || 'pat';
    const login = req.query.login;
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    if (!login) return res.status(400).json({ success: false, message: 'login required' });
    const data = await githubService.getOpenPRs(token, login, type);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /integrations/github/activity?login=<username>
 *  Returns contribution stats (commits/week, PRs/week, daily chart)
 */
router.get('/github/activity', async (req, res) => {
  try {
    const token = req.headers['x-github-token'];
    const type = req.query.type || 'pat';
    const login = req.query.login;
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    if (!login) return res.status(400).json({ success: false, message: 'login required' });
    const data = await githubService.getContributionStats(token, login, type);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /integrations/github/oauth/token
 *  Body: { code, redirectUri } — exchanges GitHub OAuth code for token
 */
router.post('/github/oauth/token', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    const clientId = config.githubClientId;
    const clientSecret = config.githubClientSecret;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ success: false, message: 'GitHub OAuth not configured on server' });
    }
    const data = await githubService.exchangeOAuthCode(code, clientId, clientSecret, redirectUri);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
