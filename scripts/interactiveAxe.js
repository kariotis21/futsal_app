const puppeteer = require('puppeteer');
const AxeBuilder = require('@axe-core/puppeteer').default;
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'http://localhost:5173';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Click the Add Team Goal button to open the scorer sheet
  try {
    await page.click('button[aria-label="Add team goal"]');
    await page.waitForSelector('#scorer-sheet-title', { timeout: 2000 });
  } catch (err) {
    console.warn('Could not open scorer sheet:', err.message);
  }

  const results = await new AxeBuilder({ page }).analyze();
  fs.writeFileSync('pa11y-interactive.json', JSON.stringify(results, null, 2));
  console.log('Wrote pa11y-interactive.json');
  await browser.close();
})();
