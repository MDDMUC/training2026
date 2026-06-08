import 'dotenv/config';
import postgres from 'postgres';
const url = process.env.DATABASE_URL!;
const sql = postgres(url, { ssl: 'require', max: 1, types: {
  date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
  timestamp: { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
  timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
}});
try {
  for (const dt of ['2026-06-09', '2026-06-12']) {
    const sess = await sql`SELECT id, date, type, title FROM sessions WHERE user_id='martin' AND date=${dt} LIMIT 1`;
    if (!sess[0]) { console.log(`\n${dt}: no session`); continue; }
    console.log(`\n=== ${dt} · ${sess[0].type} · ${sess[0].title} (session ${sess[0].id}) ===`);
    const ex = await sql`SELECT id, name, display_order, notes FROM exercises WHERE session_id=${sess[0].id} ORDER BY display_order`;
    for (const e of ex) {
      console.log(`  ${e.display_order}. ${e.name}`);
      const sets = await sql`SELECT set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe FROM exercise_sets WHERE exercise_id=${e.id} ORDER BY set_num`;
      for (const s of sets) {
        const parts = [`#${s.set_num}`, s.kind, s.label, s.reps && `${s.reps}r`, s.load_kg && `${s.load_kg}kg`, s.load_kg_added && `+${s.load_kg_added}kg`, s.hold_seconds && `${s.hold_seconds}s`, s.rest_seconds && `rest ${s.rest_seconds}s`, s.rpe && `RPE${s.rpe}`].filter(Boolean);
        console.log(`     ${parts.join(' · ')}`);
      }
    }
  }
} finally { await sql.end(); }
