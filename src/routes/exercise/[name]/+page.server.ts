import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import { getExerciseInstancesByName, getDistinctExerciseNames } from '$lib/db/queries';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const name = decodeURIComponent(params.name);
  const sql = getSql();
  const userId = locals.user!.id;
  const [instances, allNames] = await Promise.all([
    getExerciseInstancesByName(sql, userId, name),
    getDistinctExerciseNames(sql, userId)
  ]);
  if (instances.length === 0) error(404, `No exercise named "${name}" in the database`);
  const idx = allNames.indexOf(name);
  const prevName = idx > 0 ? allNames[idx - 1] : null;
  const nextName = idx >= 0 && idx < allNames.length - 1 ? allNames[idx + 1] : null;

  return {
    name,
    instances,
    prevName,
    nextName,
    namesCount: allNames.length
  };
};
