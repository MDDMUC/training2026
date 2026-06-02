import type { PageServerLoad, Actions } from './$types';
import { getSql } from '$lib/db';
import {
  getSessionByDate,
  getPhaseForDate,
  getSessionPrescription,
  getExerciseContext,
  getBodyweightHistory,
  toggleSetCompleted,
  updateSetField,
  updateSessionFields,
  recomputeSessionCompletion,
  getSessionIdFromSetId,
  markAllSetsInExercise,
  updateExerciseNotes,
  insertExercise,
  deleteExercise,
  insertSet,
  deleteSet,
  getLastSetForExercise,
  insertTindeqTest,
  insertPullupTest,
  getRecentTindeqTests,
  getAllTindeqTests,
  getClimbingAttempts,
  insertClimbingAttempt,
  deleteClimbingAttempt,
  getRunningLogsForSession,
  insertRunningLog,
  deleteRunningLog,
  getSessionsForDate,
  getAdjacentSessionDate
} from '$lib/db/queries';
import { format, parseISO, isValid } from 'date-fns';
import { error, fail } from '@sveltejs/kit';
import { estimateOneRepMaxAdded } from '$lib/domain/types';
import type { ClimbStyle } from '$lib/domain/types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const dateISO = params.date;
  const d = parseISO(dateISO);
  if (!isValid(d)) error(400, 'Invalid date');

  const sql = getSql();
  const userId = locals.user!.id;

  // ─── Stage 1: queries with no dependencies — fire all 5 in parallel ───
  // This collapses what used to be ~15 sequential round-trips down to 3
  // RTT-bound stages. On the Supabase pooler at ~60ms/query, that's the
  // difference between ~900ms and ~180ms before SvelteKit can render.
  const [sessionsForDate, phase, weightHistory, prevDate, nextDate] = await Promise.all([
    getSessionsForDate(sql, userId, dateISO),
    getPhaseForDate(sql, userId, dateISO),
    getBodyweightHistory(sql, userId),
    getAdjacentSessionDate(sql, userId, dateISO, 'prev'),
    getAdjacentSessionDate(sql, userId, dateISO, 'next')
  ]);

  const sessionParam = url.searchParams.get('session');
  let session: typeof sessionsForDate[number] | null = null;
  if (sessionParam) {
    const sId = Number(sessionParam);
    session = sessionsForDate.find((s) => s.id === sId) ?? null;
  }
  if (!session) {
    session = sessionsForDate[0] ?? null;
  }

  const isClimb = session?.type === 'climb-indoor' || session?.type === 'climb-outdoor';
  const isRun =
    session?.type === 'run' ||
    session?.type === 'mobility' ||
    (session?.title?.toLowerCase().includes('run') ?? false);
  const isTest = session?.type === 'test';

  // ─── Stage 2: queries that need the resolved session — all parallel ───
  const [prescription, climbingAttempts, runs, recentTindeqR, recentTindeqL, allTindeq] =
    await Promise.all([
      session ? getSessionPrescription(sql, userId, session.id) : Promise.resolve([]),
      isClimb && session
        ? getClimbingAttempts(sql, userId, session.id)
        : Promise.resolve([] as Awaited<ReturnType<typeof getClimbingAttempts>>),
      isRun && session
        ? getRunningLogsForSession(sql, userId, session.id)
        : Promise.resolve([] as Awaited<ReturnType<typeof getRunningLogsForSession>>),
      isTest ? getRecentTindeqTests(sql, userId, 'R', 6) : Promise.resolve([] as Awaited<ReturnType<typeof getRecentTindeqTests>>),
      isTest ? getRecentTindeqTests(sql, userId, 'L', 6) : Promise.resolve([] as Awaited<ReturnType<typeof getRecentTindeqTests>>),
      isTest ? getAllTindeqTests(sql, userId) : Promise.resolve([] as Awaited<ReturnType<typeof getAllTindeqTests>>)
    ]);

  // ─── Stage 3: per-exercise context — also parallel (was the worst
  // offender; previously a serial for-loop that did N round-trips). ───
  const exerciseContexts: Record<number, Awaited<ReturnType<typeof getExerciseContext>>> = {};
  if (session && prescription.length > 0) {
    const contexts = await Promise.all(
      prescription.map((ex) =>
        getExerciseContext(sql, userId, dateISO, session!.id, ex.name).then(
          (ctx) => [ex.id, ctx] as const
        )
      )
    );
    for (const [exId, ctx] of contexts) exerciseContexts[exId] = ctx;
  }

  const priorWeights = weightHistory.filter((w) => w.date < dateISO);
  const previousWeight = priorWeights.length > 0 ? priorWeights[priorWeights.length - 1] : null;

  return {
    dateISO,
    dateLabel: format(d, 'EEEE, MMMM d, yyyy'),
    session,
    phase,
    prescription,
    isTest,
    recentTindeqR,
    recentTindeqL,
    allTindeq,
    exerciseContexts,
    previousWeight,
    isClimb,
    climbingAttempts,
    isRun,
    runs,
    prevDate,
    nextDate,
    sessionsForDate
  };
};

export const actions: Actions = {
  toggleSet: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const setId = Number(form.get('setId'));
    if (!Number.isFinite(setId)) return fail(400, { error: 'bad setId' });
    await toggleSetCompleted(sql, userId, setId);
    const sessionId = await getSessionIdFromSetId(sql, userId, setId);
    if (sessionId !== null) await recomputeSessionCompletion(sql, userId, sessionId);
    return { ok: true };
  },

  updateExerciseNotes: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const exerciseId = Number(form.get('exerciseId'));
    const notes = form.get('notes');
    if (!Number.isFinite(exerciseId)) return fail(400, { error: 'bad exerciseId' });
    await updateExerciseNotes(sql, userId, exerciseId, notes === null ? null : String(notes));
    return { ok: true };
  },

  markExerciseSets: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const exerciseId = Number(form.get('exerciseId'));
    const completed = form.get('completed') === 'true' ? 1 : 0;
    const sessionIdParam = Number(form.get('sessionId'));
    if (!Number.isFinite(exerciseId)) return fail(400, { error: 'bad exerciseId' });
    await markAllSetsInExercise(sql, userId, exerciseId, completed);
    if (Number.isFinite(sessionIdParam)) {
      await recomputeSessionCompletion(sql, userId, sessionIdParam);
    }
    return { ok: true };
  },

  updateSet: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const setId = Number(form.get('setId'));
    const field = String(form.get('field')) as
      | 'reps'
      | 'load_kg'
      | 'load_kg_added'
      | 'hold_seconds'
      | 'rpe'
      | 'notes';
    const rawValue = form.get('value');
    if (!Number.isFinite(setId)) return fail(400, { error: 'bad setId' });
    let value: number | string | null = null;
    if (rawValue !== null && rawValue !== '') {
      if (field === 'notes') {
        value = String(rawValue);
      } else {
        const n = Number(rawValue);
        value = Number.isFinite(n) ? n : null;
      }
    }
    await updateSetField(sql, userId, setId, field, value);
    return { ok: true };
  },

  updateSession: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const sessionId = Number(form.get('sessionId'));
    if (!Number.isFinite(sessionId)) return fail(400, { error: 'bad sessionId' });

    const fields: Parameters<typeof updateSessionFields>[3] = {};
    for (const key of [
      'duration_min',
      'rpe',
      'body_weight_kg',
      'sleep_hours',
      'readiness'
    ] as const) {
      const raw = form.get(key);
      if (raw !== null) {
        const n = Number(raw);
        fields[key] = raw === '' ? null : Number.isFinite(n) ? n : null;
      }
    }
    const notes = form.get('notes');
    if (notes !== null) fields.notes = String(notes);

    const completedRaw = form.get('completed');
    if (completedRaw !== null) fields.completed = completedRaw === 'true' ? 1 : 0;

    await updateSessionFields(sql, userId, sessionId, fields);
    return { ok: true };
  },

  recordTindeq: async ({ request, params, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const peakL = Number(form.get('peak_l_kg'));
    const peakR = Number(form.get('peak_r_kg'));
    const edge = Number(form.get('edge_mm') ?? 20);
    const grip = String(form.get('grip_position') ?? 'half-crimp') as
      | 'half-crimp'
      | 'open-hand'
      | 'full-crimp'
      | 'sloper'
      | 'pinch';
    const bw = form.get('body_weight_kg');
    const bodyWeight = bw && bw !== '' ? Number(bw) : null;
    const notes = form.get('notes');

    if (!Number.isFinite(peakL) || !Number.isFinite(peakR)) {
      return fail(400, { error: 'bad peak values' });
    }

    const session = await getSessionByDate(sql, userId, params.date);

    await insertTindeqTest(sql, userId, {
      session_id: session?.id ?? null,
      date: params.date,
      hand: 'L',
      edge_mm: edge,
      grip_position: grip,
      peak_force_kg: peakL,
      body_weight_kg: bodyWeight,
      notes: notes ? String(notes) : null
    });
    await insertTindeqTest(sql, userId, {
      session_id: session?.id ?? null,
      date: params.date,
      hand: 'R',
      edge_mm: edge,
      grip_position: grip,
      peak_force_kg: peakR,
      body_weight_kg: bodyWeight,
      notes: notes ? String(notes) : null
    });
    return { ok: true };
  },

  recordPullup: async ({ request, params, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const bw = Number(form.get('body_weight_kg'));
    const topAdded = Number(form.get('top_load_added_kg'));
    const topReps = Number(form.get('top_reps'));
    const notes = form.get('notes');

    if (!Number.isFinite(bw) || !Number.isFinite(topAdded) || !Number.isFinite(topReps)) {
      return fail(400, { error: 'bad inputs' });
    }

    const oneRm = estimateOneRepMaxAdded(bw, topAdded, topReps);
    const session = await getSessionByDate(sql, userId, params.date);

    await insertPullupTest(sql, userId, {
      session_id: session?.id ?? null,
      date: params.date,
      body_weight_kg: bw,
      top_load_added_kg: topAdded,
      top_reps: topReps,
      estimated_1rm_added_kg: oneRm,
      notes: notes ? String(notes) : null
    });
    return { ok: true };
  },

  recordClimb: async ({ request, params, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const grade = String(form.get('grade') ?? '').trim();
    const style = String(form.get('style') ?? 'attempt') as ClimbStyle;
    const routeName = String(form.get('route_name') ?? '').trim();
    const notesRaw = String(form.get('notes') ?? '').trim();

    if (!grade) return fail(400, { error: 'grade required' });

    const sess = await getSessionByDate(sql, userId, params.date);
    if (!sess) return fail(404, { error: 'no session' });

    await insertClimbingAttempt(sql, userId, {
      session_id: sess.id,
      route_name: routeName || null,
      grade,
      style,
      notes: notesRaw || null
    });
    return { ok: true };
  },

  addExercise: async ({ request, params, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const notes = form.get('notes');
    if (!name) return fail(400, { error: 'name required' });
    const sess = await getSessionByDate(sql, userId, params.date);
    if (!sess) return fail(404, { error: 'no session' });
    const exId = await insertExercise(sql, userId, sess.id, name, notes ? String(notes) : null);
    await insertSet(sql, userId, exId, { kind: 'work' });
    return { ok: true };
  },

  deleteExercise: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const exerciseId = Number(form.get('exerciseId'));
    const sessionIdParam = Number(form.get('sessionId'));
    if (!Number.isFinite(exerciseId)) return fail(400, { error: 'bad exerciseId' });
    await deleteExercise(sql, userId, exerciseId);
    if (Number.isFinite(sessionIdParam)) {
      await recomputeSessionCompletion(sql, userId, sessionIdParam);
    }
    return { ok: true };
  },

  addSet: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const exerciseId = Number(form.get('exerciseId'));
    if (!Number.isFinite(exerciseId)) return fail(400, { error: 'bad exerciseId' });
    const echo = await getLastSetForExercise(sql, userId, exerciseId);
    await insertSet(sql, userId, exerciseId, {
      kind: 'work',
      reps: echo?.reps ?? null,
      load_kg: echo?.load_kg ?? null,
      load_kg_added: echo?.load_kg_added ?? null,
      hold_seconds: echo?.hold_seconds ?? null,
      rest_seconds: echo?.rest_seconds ?? null
    });
    return { ok: true };
  },

  deleteSet: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const setId = Number(form.get('setId'));
    const sessionIdParam = Number(form.get('sessionId'));
    if (!Number.isFinite(setId)) return fail(400, { error: 'bad setId' });
    await deleteSet(sql, userId, setId);
    if (Number.isFinite(sessionIdParam)) {
      await recomputeSessionCompletion(sql, userId, sessionIdParam);
    }
    return { ok: true };
  },

  deleteClimb: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const id = Number(form.get('id'));
    if (!Number.isFinite(id)) return fail(400, { error: 'bad id' });
    await deleteClimbingAttempt(sql, userId, id);
    return { ok: true };
  },

  recordRun: async ({ request, params, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const distance = Number(form.get('distance_km'));
    const duration = Number(form.get('duration_min'));
    const surface = String(form.get('surface') ?? '').trim() || null;
    const notes = String(form.get('notes') ?? '').trim() || null;
    if (!Number.isFinite(distance) || distance <= 0) {
      return fail(400, { error: 'invalid distance' });
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      return fail(400, { error: 'invalid duration' });
    }

    const sess = await getSessionByDate(sql, userId, params.date);
    if (!sess) return fail(404, { error: 'no session' });

    await insertRunningLog(sql, userId, {
      session_id: sess.id,
      date: params.date,
      distance_km: distance,
      duration_min: duration,
      surface,
      notes
    });
    return { ok: true };
  },

  deleteRun: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const id = Number(form.get('id'));
    if (!Number.isFinite(id)) return fail(400, { error: 'bad id' });
    await deleteRunningLog(sql, userId, id);
    return { ok: true };
  }
};
