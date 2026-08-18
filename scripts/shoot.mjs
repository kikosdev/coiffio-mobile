// Level 2 visual verification: headless screenshots of Expo Router (RN-web) screens.
// No application code is touched by this script.
//
// Usage:
//   node scripts/shoot.mjs [route1 route2 ...]
//
// Each route is a path under the Expo Router web root (e.g. "/team", "/stock/new").
// If no routes are passed, a default owner-surface list is used (see DEFAULT_ROUTES).
//
// Auth: owner screens are role-guarded and redirect to /login if no session is present.
// This script logs in once (seeded dev owner account) before shooting any route, then
// reuses the same authenticated browser context for every screenshot.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', '__shots__');

const BASE_URL = process.env.SHOOT_BASE_URL ?? 'http://localhost:8081';
const OWNER_EMAIL = process.env.SHOOT_OWNER_EMAIL ?? 'alpha@test.tn';
const OWNER_PASSWORD = process.env.SHOOT_OWNER_PASSWORD ?? 'Test1234!';

// The running Expo web bundle was built with EXPO_PUBLIC_API_URL pointing at the deployed
// Render backend (see salon-mobile/.env), and that backend's CORS allowlist doesn't include
// http://localhost:8081 — every fetch from a browser at this origin is rejected before this
// script's own login step even runs. Rather than editing .env (which would require restarting
// the dev server this script doesn't own), redirect matching requests at the network level to
// a local backend instance instead.
const REMOTE_API_HOST = process.env.SHOOT_REMOTE_API_HOST ?? 'coif-backend.onrender.com';
const LOCAL_API_ORIGIN = process.env.SHOOT_LOCAL_API_ORIGIN ?? 'http://localhost:3000';

async function installApiRedirect(page) {
  if (!REMOTE_API_HOST) return;
  await page.route(`https://${REMOTE_API_HOST}/**`, async (route) => {
    const req = route.request();
    const redirected = req.url().replace(`https://${REMOTE_API_HOST}`, LOCAL_API_ORIGIN);
    const res = await page.request.fetch(redirected, {
      method: req.method(),
      headers: req.headers(),
      data: req.postDataBuffer() ?? undefined,
    });
    await route.fulfill({
      status: res.status(),
      headers: res.headers(),
      body: await res.body(),
    });
  });
}

const DEFAULT_ROUTES = [
  { name: 'team', path: '/team' },
  { name: 'horaires', path: '/hours/salon' },
  { name: 'agenda', path: '/agenda' },
  { name: 'stock', path: '/stock' },
  { name: 'stock-new', path: '/stock/new' },
  { name: 'ventes', path: '/ventes' },
  { name: 'ventes-new', path: '/ventes/new' },
  { name: 'caisse', path: '/caisse' },
  { name: 'orders', path: '/orders' },
];

const ROOT_SELECTOR = '#root, [data-testid="app-root"], body > div';
const NAV_TIMEOUT_MS = 20_000;
const SETTLE_MS = 600; // let RN-web layout/animations settle after networkidle

// expo-secure-store 56.0.4's web shim (ExpoSecureStore.web.ts) exports `{}` — every call to
// getItemAsync/setItemAsync/deleteItemAsync throws "not a function", crashing the app on EVERY
// page load in a browser (hydrate() in app/_layout.tsx calls it on mount). This is a known
// RN-web native-module gap, not an app bug — this test harness patches the dev bundle response
// in-flight (no repo file is touched) to back it with localStorage, purely so screenshots can
// reach real authenticated screens.
const SS_ORIGINAL = 'var _default = {};\n},872,[],"node_modules/expo-secure-store/build/ExpoSecureStore.web.js");';
const SS_POLYFILL = `var _default = {
  getValueWithKeyAsync: async function(key) { return window.localStorage.getItem('secstore_' + key); },
  setValueWithKeyAsync: async function(value, key) { window.localStorage.setItem('secstore_' + key, value); },
  deleteValueWithKeyAsync: async function(key) { window.localStorage.removeItem('secstore_' + key); },
};
},872,[],"node_modules/expo-secure-store/build/ExpoSecureStore.web.js");`;

async function installSecureStoreWebShim(page) {
  await page.route('**/entry.bundle**', async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    if (!body.includes(SS_ORIGINAL)) {
      return route.fulfill({ response: res }); // module id/content changed — serve unmodified
    }
    await route.fulfill({ response: res, body: body.replace(SS_ORIGINAL, SS_POLYFILL) });
  });
}

function slugify(routePath) {
  return routePath.replace(/^\//, '').replace(/\//g, '-') || 'index';
}

async function login(page) {
  await page.goto(`${BASE_URL}/login?role=owner`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT_MS });
  await page.getByPlaceholder('owner@yourbrand.com or +216 XX XXX XXX').fill(OWNER_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(OWNER_PASSWORD);
  await page.getByText('Sign in', { exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: NAV_TIMEOUT_MS });
  await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT_MS }).catch(() => {});
}

async function shootRoute(page, route) {
  const url = `${BASE_URL}${route.path}`;
  const outFile = path.join(OUT_DIR, `${route.name}.png`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT_MS });
    await page.waitForSelector(ROOT_SELECTOR, { timeout: NAV_TIMEOUT_MS });
    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({ path: outFile });
    console.log(`[ok]    ${route.name.padEnd(14)} ${url} -> ${path.relative(process.cwd(), outFile)}`);
    return { ...route, status: 'ok', outFile };
  } catch (err) {
    console.error(`[error] ${route.name.padEnd(14)} ${url} -> ${err.message.split('\n')[0]}`);
    // Best-effort screenshot even on timeout/blank screen, so the failure is still visible.
    try {
      await page.screenshot({ path: outFile });
    } catch {
      // page may be in an unrecoverable state (e.g. crashed) — nothing more to capture.
    }
    return { ...route, status: 'error', error: err.message, outFile };
  }
}

async function main() {
  const argRoutes = process.argv.slice(2);
  const routes = argRoutes.length > 0
    ? argRoutes.map((p) => ({ name: slugify(p), path: p.startsWith('/') ? p : `/${p}` }))
    : DEFAULT_ROUTES;

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await installSecureStoreWebShim(page);
  await installApiRedirect(page);

  console.log(`Logging in as ${OWNER_EMAIL} at ${BASE_URL} ...`);
  try {
    await login(page);
    console.log('Login OK.\n');
  } catch (err) {
    console.error(`Login FAILED: ${err.message}`);
    console.error('Continuing anyway — screens will likely show the login/redirect state.\n');
  }

  const results = [];
  for (const route of routes) {
    results.push(await shootRoute(page, route));
  }

  await browser.close();

  const ok = results.filter((r) => r.status === 'ok').length;
  console.log(`\n${ok}/${results.length} screens captured into ${path.relative(process.cwd(), OUT_DIR)}`);
  const failed = results.filter((r) => r.status === 'error');
  if (failed.length > 0) {
    console.log('Failed:', failed.map((r) => r.name).join(', '));
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
