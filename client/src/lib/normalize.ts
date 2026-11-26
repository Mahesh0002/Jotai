/**
 * Boundary adapter between the SQLite backend and the React client.
 *
 * The backend repositories return raw rows: `id`, `folder_id`, `start_time`,
 * `is_starred`, and JSON-encoded TEXT columns. The UI was written against the
 * old Mongoose shape: `_id`, camelCase, populated objects. All translation
 * happens here so no component needs to know about the datastore.
 */

const JSON_COLUMNS = new Set([
  "tags",
  "subtasks",
  "tagIds",
  "tag_ids",
  "flags",
  "actions",
  "data",
  "toolCalls",
  "tool_calls",
  "userModel",
  "user_model",
  "memorySummary",
  "memory_summary",
  "settings",
  "integrations",
  "payload",
  "context",
  "params",
  "result",
]);

const BOOLEAN_COLUMNS = new Set(["isStarred", "pinned", "completed", "accepted", "active"]);

/** Columns whose contents are opaque to key translation. */
const OPAQUE_OUTGOING = new Set([
  "settings",
  "integrations",
  "userModel",
  "memorySummary",
  "context",
  "params",
  "result",
  "payload",
]);

/** Columns stored as JSON TEXT in SQLite. */
const JSON_OUTGOING = new Set(["tags", "subtasks", "tagIds", "flags", "actions", "data"]);

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)
  );
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** Deeply translate a backend payload into the shape the UI expects. */
export function fromApi(value: unknown): any {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(fromApi);
  if (!isPlainObject(value)) return value;

  const out: Record<string, any> = {};
  for (const [key, raw] of Object.entries(value)) {
    const targetKey = key === "id" || key === "_id" ? "_id" : snakeToCamel(key);
    let next: unknown = raw;
    if (JSON_COLUMNS.has(key)) next = parseJson(raw);
    if (BOOLEAN_COLUMNS.has(targetKey) && (next === 0 || next === 1)) {
      next = next === 1;
    }
    out[targetKey] = fromApi(next);
  }
  return out;
}

/** Translate a UI payload into column names the SQLite repositories expect. */
export function toApiPayload(body: unknown): any {
  if (!isPlainObject(body)) return body;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const column = key === "_id" ? "id" : camelToSnake(key);
    if (OPAQUE_OUTGOING.has(key)) {
      out[column] = value;
      continue;
    }
    if (JSON_OUTGOING.has(key) && Array.isArray(value)) {
      out[column] = JSON.stringify(value);
      continue;
    }
    if (JSON_OUTGOING.has(key) && isPlainObject(value)) {
      out[column] = JSON.stringify(value);
      continue;
    }
    out[column] = value;
  }
  return out;
}

function toTimestamp(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Endpoint-specific shaping on top of the generic translation.
 * Keeps the legacy CalendarEvent shape used by WeekView / TodayContainer.
 */
export function normalizePayload(url: string, payload: unknown): any {
  if (payload === null || payload === undefined) return payload;

  const path = url.split("?")[0] ?? "";

  if (/\/today\/calendar$/.test(path) || /\/calendar\/events$/.test(path)) {
    const rows = Array.isArray(payload) ? payload : [];
    return rows.map((row: Record<string, any>) => {
      const source = row["source"] ?? "calendar";
      return {
        _id: row["id"] ?? row["_id"],
        title: row["title"] ?? "Untitled",
        detail: source,
        start: toTimestamp(row["start_time"] ?? row["startTime"] ?? row["start"]),
        end: toTimestamp(row["end_time"] ?? row["endTime"] ?? row["end"]),
        color: source === "assistant" ? "#a855f7" : "#3b82f6",
        source,
      };
    });
  }

  return fromApi(payload);
}
