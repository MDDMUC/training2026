import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Anthropic NL parse retired 2026-09-04. Nutrition is manual entry (or agent-logged).
export const POST: RequestHandler = async () => {
  return json(
    {
      error:
        'Nutrition text estimate is disabled. Enter calories/macros manually on Today, or ask the coding agent to log food.'
    },
    { status: 410 }
  );
};
