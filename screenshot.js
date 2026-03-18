/**
 * Screenshot script — correct tab names + state injection
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT = '/tmp/screenshots2';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'mobile',  width: 390,  height: 844,  dpr: 3, mobile: true  },
  { name: 'ipad',    width: 820,  height: 1180, dpr: 2, mobile: true  },
  { name: 'desktop', width: 1440, height: 900,  dpr: 1, mobile: false },
];

// Actual tab data-tab values
const TABS = ['boarding', 'homevisit', 'settings'];

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shot(page, name) {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log('  📸', name);
}

async function clickTab(page, tab) {
  await page.evaluate(t => {
    document.querySelectorAll(`[data-tab="${t}"]`)[0]?.click();
  }, tab);
  await wait(500);
}

async function openBtn(page, onclickContains) {
  return page.evaluate(s => {
    const btn = document.querySelector(`button[onclick*="${s}"]`);
    if (btn) { btn.click(); return true; }
    return false;
  }, onclickContains);
}

async function closeModal(page) {
  await page.evaluate(() => {
    const open = document.querySelectorAll('.modal:not(.hidden)');
    if (open.length) open[open.length - 1].querySelector('.modal-overlay')?.click();
  });
  await wait(500);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 30000,
  });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name.toUpperCase()} ===`);
    const page = await browser.newPage();

    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, isMobile: vp.mobile, hasTouch: vp.mobile });

    // Intercept Supabase to bypass auth + return empty data
    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      if (url.includes('/auth/v1/')) {
        req.respond({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ access_token: 'tok', token_type: 'bearer', expires_in: 3600, refresh_token: 'ref',
            user: { id: 'uid', email: 'demo@test.com', role: 'authenticated' } }) });
      } else if (url.includes('supabase.co/rest/')) {
        req.respond({ status: 200, contentType: 'application/json', body: '[]' });
      } else req.continue();
    });

    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await wait(2000);

    // Force show app
    await page.evaluate(() => {
      document.getElementById('login-page')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
      document.getElementById('loading-overlay')?.classList.add('hidden');
      document.getElementById('app').style.overflow = '';
      const d = '2026年3月18日';
      const el1 = document.getElementById('today-date');
      const el2 = document.getElementById('today-date-visit');
      if (el1) el1.textContent = d;
      if (el2) el2.textContent = d;
    });
    await wait(300);

    // ── Tab screenshots ───────────────────────────────────────────
    for (const tab of TABS) {
      await clickTab(page, tab);
      await shot(page, `${vp.name}_tab_${tab}`);
    }

    // ── Login page ────────────────────────────────────────────────
    await page.evaluate(() => {
      document.getElementById('login-page')?.classList.remove('hidden');
      document.getElementById('app')?.classList.add('hidden');
    });
    await wait(300);
    await shot(page, `${vp.name}_login`);
    await page.evaluate(() => {
      document.getElementById('login-page')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
    });

    // ── Modal: New Boarding ───────────────────────────────────────
    await clickTab(page, 'boarding');
    if (await openBtn(page, 'openAddBoarding')) {
      await wait(700);
      await shot(page, `${vp.name}_modal_boarding`);
      await closeModal(page);
    }

    // ── Modal: New Owner ──────────────────────────────────────────
    if (await openBtn(page, 'openAddOwner')) {
      await wait(700);
      await shot(page, `${vp.name}_modal_owner`);
      await closeModal(page);
    }

    // ── Modal: New Cat ────────────────────────────────────────────
    if (await openBtn(page, 'openAddCat')) {
      await wait(700);
      await shot(page, `${vp.name}_modal_cat`);
      await closeModal(page);
    }

    // ── Modal: New Home Visit ─────────────────────────────────────
    await clickTab(page, 'homevisit');
    if (await openBtn(page, 'openAddHomeVisit')) {
      await wait(700);
      await shot(page, `${vp.name}_modal_homevisit`);
      await closeModal(page);
    }

    // ── Modal: New Room Type ──────────────────────────────────────
    await clickTab(page, 'settings');
    if (await openBtn(page, 'openAddRoomType')) {
      await wait(700);
      await shot(page, `${vp.name}_modal_roomtype`);
      await closeModal(page);
    }

    await page.close();
    console.log(`  ✅ ${vp.name} done`);
  }

  await browser.close();
  console.log('\n✅ Done:', OUT);
})();
