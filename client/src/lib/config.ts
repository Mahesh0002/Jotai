// Single source of truth for service URLs. Override with VITE_* env vars.
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const BACKEND_API_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_API_URL ?? "http://localhost:5000/api/v1",
);

export const RUNNER_API_URL = trimTrailingSlash(
  import.meta.env.VITE_RUNNER_API_URL ?? "http://localhost:8000/api",
);
