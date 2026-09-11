// Log Martin's body weight for 2026-09-11 on the Pull A session + daily check-in.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-11';
const SESSION_ID = 250;
const BW = 82.7;

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 1,
  prepare: false,
  types: {
    date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamp: { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
  }
});

try {
  const sess = await sql<{ id: number }[]>`
    SELECT id FROM sessions
    WHERE id = ${SESSION_ID} AND user_id = ${USER_ID} AND date = ${DATE}
  `;
  if (sess.length !== 1) {
    console.error('Expected session', SESSION_ID, 'on', DATE, '— found', sess);
    process.exit(1);
  }

  await sql.begin(async (tx) => {
    await tx`
      UPDATE sessions
      SET body_weight_kg = ${BW}, updated_at = NOW()
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID}
    `;
    await tx`
      INSERT INTO daily_check_ins (user_id, date, body_weight_kg)
      VALUES (${USER_ID}, ${DATE}, ${BW})
      ON CONFLICT (user_id, date)
      DO UPDATE SET body_weight_kg = EXCLUDED.body_weight_kg
    `;
  });

  const check = await sql`
    SELECT s.id, s.date::text AS date, s.body_weight_kg AS session_bw,
           c.body_weight_kg AS checkin_bw
    FROM sessions s
    LEFT JOIN daily_check_ins c ON c.user_id = s.user_id AND c.date = s.date
    WHERE s.id = ${SESSION_ID}
  `;
  console.log(check[0]);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
