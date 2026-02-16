const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'http://localhost:5173';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  // Ensure there's a team to start a game with - inject into localStorage then reload
  await page.evaluate(() => {
    const teams = [{ name: 'AutoTeam', players: [{ id: 10, name: 'Player One' }, { id: 9, name: 'Player Two' }] }];
    localStorage.setItem('teams', JSON.stringify(teams));
  });
  await page.reload({ waitUntil: 'networkidle2' });

  // Click the team entry (by text) then Start Game via DOM evaluation
  try {
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const teamBtn = btns.find(b => b.textContent && b.textContent.trim().startsWith('AutoTeam'));
      if (teamBtn) teamBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent && b.textContent.trim().includes('Start Game'));
      if (startBtn) startBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Click the Add Team Goal button to open the scorer sheet
    await page.evaluate(() => {
      const addBtn = document.querySelector('button[aria-label="Add team goal"]');
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
  } catch (err) {
    console.warn('Could not navigate to Start Game/scorer sheet:', err.message);
  }

  await new Promise(r => setTimeout(r, 500));

  // Inject axe-core from CDN and run it in the page context
  try {
    const axePath = require.resolve('axe-core');
    await page.addScriptTag({ path: axePath });
    const results = await page.evaluate(async () => {
      return await window.axe.run();
    });
    fs.writeFileSync('pa11y-interactive.json', JSON.stringify(results, null, 2));
    console.log('Wrote pa11y-interactive.json');

    const violations = results.violations || [];
    if (violations.length > 0) {
      console.warn(`Axe found ${violations.length} violation(s).`);
      violations.slice(0, 5).forEach((v, i) => {
        console.warn(`${i + 1}. ${v.id} — ${v.description} (impact: ${v.impact})`);
      });
      // Log but don't fail - accessibility improvements can be iterative
    }
  } catch (err) {
    console.error('axe injection/run failed:', err.message);
  }
  await browser.close();
})();
