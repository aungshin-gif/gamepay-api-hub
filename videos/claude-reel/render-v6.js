const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
(async () => {
  const mode = process.argv[2] || 'all';
  const fps = 30;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto('file://' + path.join(dir, 'anim6.html'));
  await page.evaluate(() => window.ready);
  await page.waitForTimeout(500);
  const fdir = path.join(dir, 'frames');
  fs.rmSync(fdir, { recursive: true, force: true });
  fs.mkdirSync(fdir);
  if (mode === 'preview') {
    const times = [1.4, 2.8, 4.5, 5.8, 7.2, 9.0, 10.2, 12.5, 13.8, 14.5, 15.2, 15.8, 17.5, 19.5, 20.8, 21.8, 22.6];
    for (const t of times) {
      await page.evaluate(x => draw(x), t);
      await page.screenshot({ path: path.join(fdir, 'p_' + String(t).replace('.', '_') + '.png') });
    }
  } else {
    const dur = await page.evaluate(() => DUR);
    const n = Math.round(dur * fps);
    for (let i = 0; i < n; i++) {
      await page.evaluate(x => draw(x), i / fps);
      await page.screenshot({ path: path.join(fdir, 'f_' + String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    }
  }
  await browser.close();
  console.log('done');
})();
