const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

/** Helper: headers for PAT auth */
const patHeaders = (token) => ({
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

/** Helper: headers for OAuth Bearer token */
const oauthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

const getHeaders = (token, type = 'pat') =>
  type === 'oauth' ? oauthHeaders(token) : patHeaders(token);

/** Get authenticated user profile */
const getUserProfile = async (token, type = 'pat') => {
  const res = await axios.get(`${GITHUB_API}/user`, { headers: getHeaders(token, type) });
  return res.data;
};

/** Get user's repositories ordered by last push */
const getRepos = async (token, type = 'pat', limit = 8) => {
  const res = await axios.get(
    `${GITHUB_API}/user/repos?sort=pushed&per_page=${limit}&type=all`,
    { headers: getHeaders(token, type) }
  );
  return res.data;
};

/** Get recent commits across all repos (search API) */
const getRecentCommits = async (token, login, type = 'pat', days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const res = await axios.get(
    `${GITHUB_API}/search/commits?q=author:${login}+author-date:>${since}&sort=author-date&order=desc&per_page=20`,
    {
      headers: {
        ...getHeaders(token, type),
        Accept: 'application/vnd.github.cloak-preview+json',
      },
    }
  );
  return res.data.items || [];
};

/** Get open PRs authored by the user */
const getOpenPRs = async (token, login, type = 'pat') => {
  const res = await axios.get(
    `${GITHUB_API}/search/issues?q=author:${login}+type:pr+state:open&per_page=10`,
    { headers: getHeaders(token, type) }
  );
  return res.data.items || [];
};

/** Get contribution stats: total commits this week */
const getContributionStats = async (token, login, type = 'pat') => {
  try {
    // Try to get events for the user
    const res = await axios.get(
      `${GITHUB_API}/users/${login}/events?per_page=100`,
      { headers: getHeaders(token, type) }
    );
    const events = res.data || [];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pushEvents = events.filter(
      (e) => e.type === 'PushEvent' && new Date(e.created_at) > oneWeekAgo
    );
    const commitsThisWeek = pushEvents.reduce(
      (sum, e) => sum + (e.payload?.commits?.length || 0),
      0
    );

    const prEvents = events.filter(
      (e) => e.type === 'PullRequestEvent' && e.payload?.action === 'opened'
        && new Date(e.created_at) > oneWeekAgo
    );

    // Build daily commit chart data (last 7 days)
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyMap[key] = 0;
    }

    pushEvents.forEach((e) => {
      const key = new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (key in dailyMap) {
        dailyMap[key] += e.payload?.commits?.length || 0;
      }
    });

    return {
      commitsThisWeek,
      prsThisWeek: prEvents.length,
      dailyCommits: Object.entries(dailyMap).map(([day, count]) => ({ day, count })),
    };
  } catch (_) {
    return { commitsThisWeek: 0, prsThisWeek: 0, dailyCommits: [] };
  }
};

/** Exchange GitHub OAuth code for access token */
const exchangeOAuthCode = async (code, clientId, clientSecret, redirectUri) => {
  const res = await axios.post(
    'https://github.com/login/oauth/access_token',
    { client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri },
    { headers: { Accept: 'application/json' } }
  );
  return res.data; // { access_token, token_type, scope }
};

module.exports = {
  getUserProfile,
  getRepos,
  getRecentCommits,
  getOpenPRs,
  getContributionStats,
  exchangeOAuthCode,
};
