// Quick smoke test: hits Claude with the same prompt/tool shape as
// /api/nutrition/parse to verify ANTHROPIC_API_KEY works.
// Run: npx tsx -r dotenv/config scripts/smoke-test-nutrition-parse.ts dotenv_config_path=.env.local

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY missing');
  process.exit(1);
}

const SYSTEM_PROMPT = `You are a nutrition estimator. Given a free-text description of food and drinks consumed in a single eating event, return your best-effort calorie and macronutrient totals.

Rules:
- Estimate generously when quantities are ambiguous (assume a typical adult serving).
- Common implicit ingredients count.
- Macros: protein, carbs, fat — all in grams. Fibre is part of carbs.
- Always call the record_intake tool. Never reply with prose.`;

const TOOL = {
  name: 'record_intake',
  description: 'Record the nutritional breakdown of the eating event described by the user.',
  input_schema: {
    type: 'object' as const,
    properties: {
      calories: { type: 'number' },
      protein_g: { type: 'number' },
      carbs_g: { type: 'number' },
      fat_g: { type: 'number' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            food: { type: 'string' },
            qty: { type: 'string' },
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

const client = new Anthropic({ apiKey });
const description = '2 eggs scrambled in butter, 2 slices sourdough toast, large coffee with oat milk';

const res = await client.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: 1024,
  system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
  tools: [TOOL],
  tool_choice: { type: 'tool', name: TOOL.name },
  messages: [{ role: 'user', content: description }]
});

const toolUse = res.content.find((b) => b.type === 'tool_use');
if (!toolUse || toolUse.type !== 'tool_use') {
  console.error('No tool call in response. Full response:', JSON.stringify(res, null, 2));
  process.exit(1);
}
console.log('Input:', description);
console.log('Parsed:', JSON.stringify(toolUse.input, null, 2));
console.log('\nUsage:', res.usage);
