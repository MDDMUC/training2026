import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';

// Parse free-text food log → structured calories + macros.
// Uses Claude Haiku 4.5 with tool-use to force a typed JSON shape.
// System prompt is prompt-cached so repeated calls cost ~nothing.

const SYSTEM_PROMPT = `You are a nutrition estimator. Given a free-text description of food and drinks consumed in a single eating event, return your best-effort calorie and macronutrient totals.

Rules:
- Estimate generously when quantities are ambiguous (assume a typical adult serving).
- Common implicit ingredients count (e.g. "coffee with milk" → ~30 ml whole milk; "toast" → 1 slice with a thin smear of butter).
- Macros: protein, carbs, fat — all in grams. Fibre is part of carbs.
- Sanity check: calories ≈ 4·protein + 4·carbs + 9·fat (within ~10%). If the user mentions alcohol, include its 7 kcal/g but bucket it into "carbs" for simplicity.
- Always call the record_intake tool. Never reply with prose.
- Be specific in the item list: one entry per distinct food, with the quantity you assumed.`;

const TOOL = {
  name: 'record_intake',
  description: 'Record the nutritional breakdown of the eating event described by the user.',
  input_schema: {
    type: 'object' as const,
    properties: {
      calories: { type: 'number', description: 'Total calories (kcal) for the whole event.' },
      protein_g: { type: 'number', description: 'Total protein in grams.' },
      carbs_g: { type: 'number', description: 'Total carbohydrates in grams (fibre included).' },
      fat_g: { type: 'number', description: 'Total fat in grams.' },
      items: {
        type: 'array',
        description: 'Per-item breakdown with the assumed quantity. Always include at least one item.',
        items: {
          type: 'object',
          properties: {
            food: { type: 'string' },
            qty: { type: 'string', description: 'Quantity assumed, e.g. "2 large", "150 g", "1 cup".' },
            calories: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' }
          },
          required: ['food', 'calories', 'protein_g', 'carbs_g', 'fat_g']
        }
      }
    },
    required: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'items']
  }
};

interface ParsedIntake {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: { food: string; qty?: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[];
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'env.ANTHROPIC_API_KEY not set on the server' }, 500);
  }

  let description: string;
  try {
    const body = await request.json();
    description = String(body?.description ?? '').trim();
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }
  if (!description) {
    return json({ error: 'description is required' }, 400);
  }
  if (description.length > 1000) {
    return json({ error: 'description too long (max 1000 chars)' }, 400);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        }
      ],
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [{ role: 'user', content: description }]
    });

    const toolUse = res.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return json({ error: 'no tool call in response' }, 502);
    }
    const parsed = toolUse.input as ParsedIntake;
    return json({ ok: true, parsed });
  } catch (e) {
    return json({ error: 'parse failed', detail: String(e) }, 502);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
