// Print phase + session structure for martin from a given start date.
import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }
const sql = postgres(url, {
  ssl: 'require',
  max: 1,
  types: {
    date:        { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamp:   { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
  }
});
const dateArg = process.argv.slice(2).find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const FROM = dateArg ?? '2026-06-08';

try {
  const phases = await sql`
    SELECT id, mesocycle_num, name, short_name, start_date, end_date
    FROM phases WHERE user_id='martin' ORDER BY mesocycle_num
  `;
  console.log('PHASES:');
  for (const p of phases) {
    console.log(`  ${p.mesocycle_num}. ${p.short_name.padEnd(6)} ${p.start_date} → ${p.end_date}  (${p.name})`);
  }

  const sessions = await sql`
    SELECT id, date, type, title
    FROM sessions
    WHERE user_id='martin' AND date >= ${FROM}
    ORDER BY date, id
  `;
  console.log(`\nFIRST 21 sessions on/after ${FROM} (week 1–3 preview):`);
  for (const s of sessions.slice(0, 21)) {
    console.log(`  ${s.date}  ${String(s.type).padEnd(13)}  ${s.title ?? ''}`);
  }

  const total = await sql`
    SELECT COUNT(*)::int AS c
    FROM sessions WHERE user_id='martin' AND date >= ${FROM}
  `;
  console.log(`\nTotal sessions on/after ${FROM}: ${total[0].c}`);

  const byType = await sql`
    SELECT type, COUNT(*)::int AS c
    FROM sessions WHERE user_id='martin' AND date >= ${FROM}
    GROUP BY type ORDER BY c DESC
  `;
  console.log('\nBy type:');
  for (const r of byType) console.log(`  ${String(r.type).padEnd(13)} ${r.c}`);
} finally { await sql.end(); }
