import type { RequestHandler } from './$types';
import { getSql } from '$lib/db';
import { getAllSessionsWithCounts, getSessionPrescription } from '$lib/db/queries';
import { SESSION_TYPE_LABELS, type SessionType } from '$lib/domain/types';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function icsDate(iso: string): string {
  return iso.replaceAll('-', '');
}

function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    parts.push((i === 0 ? '' : ' ') + line.slice(i, i + (i === 0 ? 75 : 74)));
    i += i === 0 ? 75 : 74;
  }
  return parts.join('\r\n');
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

function nowStamp(): string {
  const d = new Date();
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function summarizeSet(s: {
  reps: number | null;
  load_kg: number | null;
  load_kg_added: number | null;
  hold_seconds: number | null;
}): string {
  const parts: string[] = [];
  if (s.reps !== null) parts.push(`${s.reps} reps`);
  if (s.hold_seconds !== null) parts.push(`${s.hold_seconds}s`);
  if (s.load_kg_added !== null) parts.push(`+${s.load_kg_added} kg`);
  else if (s.load_kg !== null) parts.push(`${s.load_kg} kg`);
  return parts.join(' · ');
}

export const GET: RequestHandler = async ({ request, locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const sessions = await getAllSessionsWithCounts(sql, userId);

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Training 2026//Local//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:Training 2026');
  lines.push('X-WR-CALDESC:H2 2026 climbing training plan');

  const dtstamp = nowStamp();

  for (const s of sessions) {
    if (s.type === 'rest') continue;

    const exercises = await getSessionPrescription(sql, userId, s.id);
    const phaseTag = s.phase_short_name ? `[${s.phase_short_name}] ` : '';
    const typeLabel = SESSION_TYPE_LABELS[s.type as SessionType];
    const titleLine = s.title ?? typeLabel;

    const descParts: string[] = [];
    descParts.push(`${typeLabel}${s.phase_name ? ' · Phase: ' + s.phase_name : ''}`);
    descParts.push('');
    for (const ex of exercises) {
      descParts.push(`• ${ex.name}`);
      const workSets = ex.sets.filter((set) => set.kind === 'work');
      if (workSets.length > 0) {
        const summary = summarizeSet(workSets[0]);
        if (workSets.length === 1) {
          descParts.push(`    ${summary}`);
        } else {
          const allSame = workSets.every((set) => summarizeSet(set) === summary);
          if (allSame) descParts.push(`    ${summary}  ×  ${workSets.length} sets`);
          else for (const w of workSets) descParts.push(`    ${summarizeSet(w)}`);
        }
      } else {
        const checklist = ex.sets.filter((set) => set.kind === 'checklist');
        if (checklist.length === 1 && checklist[0].label) {
          descParts.push(`    ${checklist[0].label}`);
        } else if (checklist.length > 1) {
          descParts.push(`    ${checklist.length} steps`);
        }
      }
    }
    descParts.push('');
    descParts.push(`Open: ${new URL('/log/by-date/' + s.date, request.url).toString()}`);

    const desc = descParts.join('\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:t2026-session-${s.id}@training2026.local`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${icsDate(s.date)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDate(nextDay(s.date))}`);
    lines.push(fold(`SUMMARY:${escapeText(phaseTag + titleLine)}`));
    lines.push(fold(`DESCRIPTION:${escapeText(desc)}`));
    lines.push(
      `CATEGORIES:Training,${s.type === 'climb-indoor' || s.type === 'climb-outdoor' ? 'Climbing' : s.type === 'pull-heavy' || s.type === 'pull-light' ? 'Pull' : s.type === 'push' ? 'Push' : s.type === 'test' ? 'Test' : 'Mobility'}`
    );
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  const body = lines.join('\r\n') + '\r\n';

  return new Response(body, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'attachment; filename="training-2026.ics"'
    }
  });
};
