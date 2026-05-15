
const https = require('https');

const targets = {
  interpol: 'https://ws-public.interpol.int/notices/v1/red?name=Putin',
  etalab: 'https://recherche-entreprises.api.gouv.fr/search?q=test',
  littlesis: 'https://littlesis.org/api/entities/search?q=test',
  worldbank: 'https://search.worldbank.org/api/v2/wds?qterm=test&format=json',
  wikidata: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=test',
  fbi: 'https://api.fbi.gov/wanted/v1/list?title=test',
  aleph: 'https://aleph.occrp.org/api/2/entities?q=test',
  wikidata_sparql: 'https://query.wikidata.org/sparql?query=SELECT%20?s%20?p%20?o%20WHERE%20{%20?s%20?p%20?o%20}%20LIMIT%201&format=json',
  sec: 'https://efts.sec.gov/LATEST/search-index?q=test',
  gleif: 'https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=test'
};

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  },
  timeout: 10000
};

function testApi(name, url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        console.log(`[${name}] STATUS: ${res.statusCode} (${duration}ms)`);
        resolve({ name, status: res.statusCode, duration });
      });
    });

    req.on('error', (err) => {
      console.log(`[${name}] FAILED: ${err.message}`);
      resolve({ name, status: 'ERROR', message: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`[${name}] TIMEOUT`);
      resolve({ name, status: 'TIMEOUT' });
    });
  });
}

async function runTests() {
  console.log('--- Testing API Endpoints ---');
  for (const [name, url] of Object.entries(targets)) {
    await testApi(name, url);
  }
  console.log('--- Tests Completed ---');
}

runTests();
