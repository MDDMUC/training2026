import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { COOKIE_OPTS, makeSessionCookie, verifyPassword } from '$lib/server/auth';

export const load: PageServerLoad = ({ url }) => {
  return { next: url.searchParams.get('next') ?? '/' };
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const form = await request.formData();
    const identifier = String(form.get('identifier') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const next = String(form.get('next') ?? url.searchParams.get('next') ?? '/');

    if (!identifier || !password) {
      return fail(400, { identifier, error: 'Username and password are required.' });
    }

    const user = await verifyPassword(identifier, password);
    if (!user) {
      return fail(401, { identifier, error: 'Incorrect username or password.' });
    }

    cookies.set(COOKIE_OPTS.name, makeSessionCookie(user.id), {
      path: '/',
      httpOnly: true,
      secure: !url.hostname.includes('localhost') && url.hostname !== '127.0.0.1',
      sameSite: 'lax',
      maxAge: COOKIE_OPTS.maxAgeSeconds
    });

    throw redirect(303, next.startsWith('/') ? next : '/');
  }
};
