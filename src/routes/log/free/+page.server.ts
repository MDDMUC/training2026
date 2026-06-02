import type { PageServerLoad, Actions } from './$types';
import { getSql } from '$lib/db';
import {
  getDistinctExerciseNames,
  getPhaseForDate,
  createFreeSession,
  insertExercise,
  insertSet
} from '$lib/db/queries';
import { fail, redirect } from '@sveltejs/kit';
import { format, parseISO, isValid } from 'date-fns';
import type { SessionType } from '$lib/domain/types';

const SESSION_TYPES: SessionType[] = [
  'pull-heavy',
  'pull-light',
  'push',
  'climb-indoor',
  'climb-outdoor',
  'mobility',
  'run',
  'rest',
  'test'
];

export const load: PageServerLoad = async ({ url, locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const dateParam = url.searchParams.get('date');
  const defaultDate =
    dateParam && isValid(parseISO(dateParam)) ? dateParam : todayISO;

  return {
    todayISO,
    defaultDate,
    libraryNames: await getDistinctExerciseNames(sql, userId),
    sessionTypes: SESSION_TYPES
  };
};

export const actions: Actions = {
  createSession: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const date = String(form.get('date') ?? '').trim();
    const type = String(form.get('type') ?? '').trim() as SessionType;
    const title = String(form.get('title') ?? '').trim() || null;
    const exerciseNames = form
      .getAll('exercise_name')
      .map((v) => String(v).trim())
      .filter(Boolean);

    if (!date || !isValid(parseISO(date))) {
      return fail(400, { error: 'invalid date' });
    }
    if (!SESSION_TYPES.includes(type)) {
      return fail(400, { error: 'invalid type' });
    }
    if (exerciseNames.length === 0) {
      return fail(400, { error: 'pick at least one exercise' });
    }

    const phase = await getPhaseForDate(sql, userId, date);
    const sessionId = await createFreeSession(sql, userId, {
      date,
      type,
      title,
      phaseId: phase?.id ?? null
    });

    for (const name of exerciseNames) {
      const exId = await insertExercise(sql, userId, sessionId, name, null);
      await insertSet(sql, userId, exId, { kind: 'work' });
    }

    redirect(303, `/log/by-date/${date}?session=${sessionId}`);
  }
};
