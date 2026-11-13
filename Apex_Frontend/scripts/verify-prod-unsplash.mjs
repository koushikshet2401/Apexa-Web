import fs from 'fs';
import https from 'https';

const data = JSON.parse(fs.readFileSync('scripts/prod-media-inventory-classified.json', 'utf8'));

const unsplashItems = data.filter(d => d.currentUrl && d.currentUrl.includes('unsplash.com'));
const uniqueUrls = [...new Set(unsplashItems.map(d => d.currentUrl))];

console.log(`Checking ${uniqueUrls.length} unique Unsplash URLs...`);

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 6000 }, (res) => {
        resolve({ url, status: res.statusCode });
      });
      req.on('timeout', () => { req.destroy(); resolve({ url, status: 408 }); });
      req.on('error', (err) => resolve({ url, status: 500, error: err.message }));
      req.end();
    } catch (e) {
      resolve({ url, status: 500, error: e.message });
    }
  });
}

async function runCheck() {
  const results = [];
  for (const url of uniqueUrls) {
    const r = await checkUrl(url);
    results.push(r);
    console.log(`[HTTP ${r.status}] ${url.substring(0, 75)}...`);
  }

  const ok = results.filter(r => r.status === 200);
  const broken = results.filter(r => r.status !== 200);

  console.log(`\nVerified Results: ${ok.length} OK (HTTP 200), ${broken.length} BROKEN / BLOCKED`);
  fs.writeFileSync('scripts/prod-unsplash-verification.json', JSON.stringify({ ok, broken }, null, 2));
}

runCheck();
