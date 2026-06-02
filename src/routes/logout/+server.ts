import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COOKIE_OPTS } from '$lib/server/auth';

export const POST: RequestHandler = ({ cookies }) => {
  cookies.delete(COOKIE_OPTS.name, { path: '/' });
  throw redirect(303, '/login');
};
