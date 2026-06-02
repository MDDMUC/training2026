import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { COOKIE_OPTS, loadUserById, parseSessionCookie } from '$lib/server/auth';

const PUBLIC_PATHS = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
  const raw = event.cookies.get(COOKIE_OPTS.name);
  const userId = parseSessionCookie(raw);
  if (userId) {
    const user = await loadUserById(userId);
    event.locals.user = user;
  } else {
    event.locals.user = null;
  }

  const path = event.url.pathname;
  const isPublic = PUBLIC_PATHS.has(path);
  if (!event.locals.user && !isPublic) {
    // Preserve original destination so we can bounce back after login
    const target = path === '/' ? '' : `?next=${encodeURIComponent(path + event.url.search)}`;
    throw redirect(303, `/login${target}`);
  }
  if (event.locals.user && path === '/login') {
    throw redirect(303, '/');
  }

  return resolve(event);
};
