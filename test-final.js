// ============================================================
//  COMPLIANCE API - FINAL VALIDATION SUITE (v2)
//  Includes UN Sanctions and Fixed DGTrésor Headers
// ============================================================

const QUERY = 'Putin'; 
const TIMEOUT = 30000; 

const results = [];

async function testApi(name, url, opts = {}) {
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
        ...opts.headers,
      },
      ...opts,
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
      if (typeof body === 'object') {
        const keys = Object.keys(body);
        console.log(`    Keys: [${keys.slice(0, 5).join(', ')}]`);
      } else {
        console.log(`    Content: ${ct} (${body.length} bytes)`);
      }
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
  // 1. Etalab
  await testApi('Etalab', 'https://recherche-entreprises.api.gouv.fr/search?q=Google&per_page=1');
  
  // 2. UN Sanctions (NEW)
  await testApi('UN Sanctions (XML)', 'https://scsanctions.un.org/resources/xml/en/consolidated.xml');

  // 3. Interpol
  await testApi('Interpol', 'https://ws-public.interpol.int/notices/v1/red?name=Putin');

  // 4. DGTrésor (Fixed Headers)
  await testApi('DGTrésor (Gels des Avoirs)', 'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-fichier-json');

  // 5. Wikidata
  await testApi('Wikidata', 'https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=Putin');

  console.log('\n' + '='.repeat(56));
  console.log('   FINAL VALIDATION SUMMARY');
  console.log('='.repeat(56));
  results.forEach(r => console.log(`${r.ok ? '✅' : '❌'} [${r.status}] ${r.name} (${r.ms}ms)`));
}

run();
