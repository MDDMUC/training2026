import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';

// Single postgres.js client for the SvelteKit server. Connection pooling is
// handled by Supabase's Supavisor (transaction pooler on port 6543), so a
// small max here is appropriate. prepare:false is required for the transaction
// pooler — it routes each query to whatever backend connection is free.
let _sql: ReturnType<typeof postgres> | null = null;

// Postgres DATE/TIMESTAMP columns deserialize to JS Date by default. SQLite
// stored these as TEXT 'YYYY-MM-DD' / ISO strings, and the whole downstream
// codebase (Svelte components, sort comparators, date-fns parseISO) expects
// strings. Override the parsers to keep that contract.
const stringTypes = {
  // DATE — OID 1082 → 'YYYY-MM-DD'
  date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
  // TIMESTAMP — OID 1114
  timestamp: { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
  // TIMESTAMPTZ — OID 1184
  timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
};

export function getSql() {
  if (_sql) return _sql;
  _sql = postgres(DATABASE_URL, {
    ssl: 'require',
    max: 5,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    types: stringTypes
  });
  return _sql;
}

export type Sql = ReturnType<typeof getSql>;
