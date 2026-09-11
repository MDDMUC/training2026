/**
 * Mobile repro for SetRow input disappearing when clearing/retyping reps.
 * Login → today's log → clear a reps input → assert the input still exists → type new value.
 *
 * Run: node scripts/verify-setrow-mobile.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const USER = process.env.T26_USER ?? 'martin';
const PASS = process.env.T26_PASS ?? 'apple';
const DATE = process.env.T26_DATE ?? '2026-09-11';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
});
const page = await context.newPage();

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  // Login form fields — match whatever the app uses
  const userInput = page.locator('input[name="id"], input[name="username"], input[name="email"], input[type="text"]').first();
  const passInput = page.locator('input[name="password"], input[type="password"]').first();
  await userInput.fill(USER);
  await passInput.fill(PASS);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  await page.goto(`${BASE}/log/by-date/${DATE}`, { waitUntil: 'networkidle' });

  const repsInput = page.locator('.set-row:not(.kind-checklist) .field input[inputmode="numeric"]').first();
  await repsInput.waitFor({ state: 'visible', timeout: 15000 });
  const before = await repsInput.inputValue();
  console.log('Initial reps value:', before);

  // Simulate the mobile bug path: select-all + clear (binds null under old code)
  await repsInput.click({ clickCount: 3 });
  await repsInput.fill('');
  await page.waitForTimeout(300);

  const stillThere = await page.locator('.set-row:not(.kind-checklist) .field input[inputmode="numeric"]').first().count();
  if (stillThere < 1) {
    throw new Error('FAIL: reps input disappeared after clear');
  }
  console.log('After clear: input still in DOM');

  // Blur/change with empty should restore, not wipe
  await repsInput.blur();
  await page.waitForTimeout(400);
  const afterBlur = await repsInput.inputValue();
  console.log('After empty blur (expect restored):', afterBlur);
  if (before && afterBlur === '') {
    throw new Error('FAIL: empty blur wiped the value instead of restoring');
  }

  // Retype a new value
  await repsInput.click({ clickCount: 3 });
  await repsInput.fill('9');
  await repsInput.blur();
  await page.waitForTimeout(600);
  const afterType = await repsInput.inputValue();
  console.log('After typing 9:', afterType);
  if (afterType !== '9') {
    throw new Error(`FAIL: expected 9 after retype, got ${afterType}`);
  }

  // Field must still be present
  const finalCount = await page.locator('.set-row:not(.kind-checklist) .field input[inputmode="numeric"]').first().count();
  if (finalCount < 1) {
    throw new Error('FAIL: reps input gone after successful edit');
  }

  console.log('PASS: SetRow reps survives clear + retype on mobile viewport');
} catch (e) {
  console.error(e);
  await page.screenshot({ path: 'scripts/verify-setrow-mobile-fail.png', fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
