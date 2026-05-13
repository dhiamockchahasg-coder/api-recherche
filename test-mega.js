// ============================================================
//  COMPLIANCE API - MEGA VALIDATION (v4)
//  Tests all 10+ Integrated APIs
// ============================================================

const QUERY = 'Putin'; 
const TIMEOUT = 35000; 

const results = [];

async function testApi(name, url, headers = {}) {
  const line = '─'.repeat(56);
  process.stdout.write(`\n${line}\n🔍  ${name}\n    ${url}\n`);
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), TIMEOUT);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'ComplianceDashboard/1.0 (https://localhost:4200)',
        'Accept': 'application/json, text/xml, */*',
        ...headers,
      }
    });
    clearTimeout(id);
    const ms = Date.now() - t0;

    const ct = res.headers.get('content-type') || '';
    let body;
    if (ct.includes('json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    if (res.ok) {
      console.log(`✅  HTTP ${res.status}  (${ms} ms)`);
      results.push({ name, status: res.status, ok: true, ms });
    } else {
      console.warn(`⚠️   HTTP ${res.status}  (${ms} ms)`);
      results.push({ name, status: res.status, ok: false, ms });
    }
  } catch (err) {
    console.error(`❌  ${err.message}`);
    results.push({ name, status: 'ERROR', ok: false, ms: Date.now() - t0 });
  }
}

async function run() {
  console.log('Starting Mega Validation...\n');
  
  // Group 1: Sanctions & Wanted
  await testApi('UN Sanctions (XML)', 'https://scsanctions.un.org/resources/xml/en/consolidated.xml');
  await testApi('DGTrésor (France)', 'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-fichier-json');
  await testApi('FBI Wanted List', 'https://api.fbi.gov/wanted/v1/list?pageSize=1');
  await testApi('Interpol Red Notices', 'https://ws-public.interpol.int/notices/v1/red?resultPerPage=1');

  // Group 2: Corporate & Relationships
  await testApi('Etalab (FR Companies)', 'https://recherche-entreprises.api.gouv.fr/search?q=Google&per_page=1');
  await testApi('LittleSis (Relationships)', 'https://littlesis.org/api/entities/search?q=Google');
  await testApi('World Bank (Debarred)', 'https://search.worldbank.org/api/v3/wds?qterm=Google&format=json');
  
  // Group 3: Investigative & Public
  await testApi('OCCRP Aleph', 'https://aleph.occrp.org/api/2/entities?q=Google&limit=1');
  await testApi('Wikidata', 'https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=Google');

  console.log('\n' + '='.repeat(56));
  console.log('   MEGA VALIDATION FINAL SUMMARY');
  console.log('='.repeat(56));
  results.forEach(r => {
    const icon = r.ok ? '✅' : (r.status === 403 || r.status === 401 ? '⚠️ ' : '❌');
    console.log(`${icon} [${String(r.status).padEnd(5)}] ${r.name.padEnd(25)} (${r.ms}ms)`);
  });
  console.log('='.repeat(56));
}

run();
