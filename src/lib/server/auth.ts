import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SESSION_SECRET } from '$env/static/private';
import { getSql } from '$lib/db';

const COOKIE_NAME = 't26_session';
const MAX_AGE_DAYS = 30;

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

export function makeSessionCookie(userId: string): string {
  // Format: <userId>.<sig>. userId is opaque short ID (martin/antonia).
  return `${userId}.${sign(userId)}`;
}

export function parseSessionCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return null;
  const userId = raw.slice(0, dot);
  const provided = raw.slice(dot + 1);
  const expected = sign(userId);
  // Constant-time compare
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
}

export async function verifyPassword(
  identifier: string,
  password: string
): Promise<AuthUser | null> {
  const sql = getSql();
  // identifier matches either id or email (case-insensitive on email)
  const rows = await sql<Array<AuthUser & { password_hash: string }>>`
    SELECT id, email, display_name, password_hash
    FROM users
    WHERE id = ${identifier} OR LOWER(email) = LOWER(${identifier})
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return { id: row.id, email: row.email, display_name: row.display_name };
}

export async function loadUserById(userId: string): Promise<AuthUser | null> {
  const sql = getSql();
  const rows = await sql<AuthUser[]>`
    SELECT id, email, display_name FROM users WHERE id = ${userId} LIMIT 1
  `;
  return rows[0] ?? null;
}

export const COOKIE_OPTS = {
  name: COOKIE_NAME,
  maxAgeSeconds: MAX_AGE_DAYS * 24 * 60 * 60
};
