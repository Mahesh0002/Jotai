/** Minimal ICS reader for subscribed calendar feeds (VEVENT only). */

function unfold(text) {
  return String(text || '')
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .split(/\r?\n/);
}

function unescape(value) {
  return String(value || '').replace(/\\([n,;\\])/g, (_match, char) => (char === 'n' ? ' ' : char));
}

function parseDate(value, allDay = false) {
  const raw = unescape(value).trim();
  let match = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(raw);
  if (!match) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const [, year, month, day, hour, minute, second, utc] = match;
  if (utc || allDay) {
    return new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
  }
  // Floating times are interpreted in the server's local timezone.
  return new Date(+year, +month - 1, +day, +hour, +minute, +second);
}

function parseIcs(text) {
  const events = [];
  let current = null;

  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) {
        const start = current.DTSTART ? parseDate(current.DTSTART.value, current.DTSTART.allDay) : null;
        const end = current.DTEND ? parseDate(current.DTEND.value, current.DTEND.allDay) : null;
        if (start && !Number.isNaN(start.getTime())) {
          events.push({
            title: current.SUMMARY || '(No title)',
            detail: current.LOCATION || current.DESCRIPTION || '',
            start: start.getTime(),
            end: end && !Number.isNaN(end.getTime()) ? end.getTime() : start.getTime() + 60 * 60 * 1000,
            color: 'bg-purple-500',
          });
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).split(';')[0].toUpperCase();
    if (!['SUMMARY', 'DESCRIPTION', 'LOCATION', 'DTSTART', 'DTEND'].includes(key)) continue;
    const params = line.slice(0, separator).toUpperCase();
    current[key] = key === 'DTSTART' || key === 'DTEND'
      ? { value: line.slice(separator + 1), allDay: params.includes('VALUE=DATE') }
      : unescape(line.slice(separator + 1));
  }

  return events;
}

module.exports = { parseIcs, parseDate };
