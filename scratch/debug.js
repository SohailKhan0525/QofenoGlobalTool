import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
  page.on('requestfailed', request => console.error('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'scratch/screenshot.png' });
  console.log('Saved screenshot to scratch/screenshot.png');
  
  await browser.close();
})();
