import { formGuideFor } from '../src/lib/domain/antoniaFormGuides';

const names = [
  'Warm-up Flow',
  'Scapular Pull-ups',
  'Band-assisted Pull-ups',
  'Inverted Rows',
  'Push-ups (variant)',
  'Band External Rotation (0° abduction)',
  'Hollow Body Hold',
  'Inverted Rows (heavier angle)',
  'Band-assisted Pull-ups (lighter scheme)',
  'Prone Y Raise',
  'Active Dead Hang',
  'TEST · Max Active Dead Hang',
  'TEST · Max Banded Pull-ups (thick band)',
  'TEST · Max Inverted Rows',
  'TEST · Max Push-ups',
  'Cool-down Mobility',
  'Scapular Pull-up Practice',
  'Eccentric (Negative) Pull-ups',
  'Push-up Plus',
  'Long Mobility Flow',
  'Band-assisted Pull-ups (medium band)',
  'Inverted Rows (deep angle)',
  'Easy Scapular Pull-ups',
  'Easy Eccentric Pull-up',
  'Easy Inverted Rows',
  'Light Mobility',
  'Eccentric (Negative) Pull-ups — Slowest',
  'Band-assisted Pull-ups (thin band)',
  'Inverted Rows (feet elevated if able)',
  'Push-ups',
  'Band External Rotation',
  'Single Unassisted Pull-up Attempt',
  'Mobility',
  'Unassisted Pull-up Attempt (fresh)',
  'Recruitment Set',
  '🎯 UNASSISTED PULL-UP — ATTEMPT 1',
  '🎯 UNASSISTED PULL-UP — ATTEMPT 2',
  '🎯 UNASSISTED PULL-UP — ATTEMPT 3 (if fresh)',
  'Final Benchmark Test (post-pull-up)',
  'Long Cool-down + Celebration',
  'TEST · Max Eccentric Descent',
  'TEST · Unassisted Pull-up Attempt',
  'Eccentric (Negative) Pull-ups — Long Descent'
];

const missing = names.filter((n) => !formGuideFor(n));
if (missing.length) {
  console.error('No guide for:', missing);
  process.exit(1);
}
console.log(`All ${names.length} Antonia exercise names map to a form guide.`);
