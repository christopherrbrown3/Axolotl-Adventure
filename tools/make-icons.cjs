// Regenerates icons/*.png from tools/icon.html using headless Chromium.
// Usage: python3 -m http.server 8123 &  then  node tools/make-icons.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:8123';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`${base}/tools/icon.html`);
  await page.waitForFunction(() => document.title === 'ready');
  const icons = await page.evaluate(() => window.icons);
  const out = path.join(__dirname, '..', 'icons');
  fs.mkdirSync(out, { recursive: true });
  for (const [name, url] of Object.entries(icons)) {
    fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote icons/' + name);
  }
  await browser.close();
})();
