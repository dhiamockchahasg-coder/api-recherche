// ============================================================
//  COMPLIANCE API - FULL VALIDATION SUITE
//  Tests every endpoint used by compliance.service.ts
// ============================================================

const QUERY = 'Putin'; // generic name that exists in most sanction lists
const TIMEOUT = 20000; // 20s per request

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
        'User-Agent': 'ComplianceDashboard/1.0 (test)',
        'Accept': 'application/json',
        ...opts.headers,
      },
      ...opts,
    });
    clearTimeout(id);
    const ms = Date.now() - t0;

    let body;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) {
      body = await res.json();
    } else {
      const txt = await res.text();
      try { body = JSON.parse(txt); } catch { body = txt; }
    }

    if (res.ok) {
      console.log(`✅  HTTP ${res.status}  (${ms} ms)`);
      // print a compact summary of the data shape
      if (typeof body === 'object' && body !== null) {
        const keys = Object.keys(body);
        console.log(`    Keys: [${keys.slice(0, 6).join(', ')}${keys.length > 6 ? ', …' : ''}]`);
        // If there's a data/results/publications array, show count
        const arr = body.data || body.results || body.publications
                    || body._embedded?.notices || body.notices
                    || body.search || [];
        if (Array.isArray(arr)) console.log(`    Items: ${arr.length}`);
      } else if (typeof body === 'string') {
        console.log(`    (text response, ${body.length} chars)`);
      }
      results.push({ name, status: res.status, ok: true, ms });
    } else {
      console.warn(`⚠️   HTTP ${res.status}  (${ms} ms)`);
      if (res.status === 401 || res.status === 403)
        console.warn(`    → Requires API key / access denied`);
      else if (res.status === 404)
        console.warn(`    → Endpoint not found`);
      else
        console.warn(`    → ${JSON.stringify(body).slice(0, 120)}`);
      results.push({ name, status: res.status, ok: false, ms });
    }
  } catch (err) {
    const ms = Date.now() - t0;
    if (err.name === 'AbortError') {
      console.error(`❌  TIMEOUT after ${TIMEOUT}ms`);
      results.push({ name, status: 'TIMEOUT', ok: false, ms });
    } else {
      console.error(`❌  ${err.message}`);
      results.push({ name, status: 'ERROR', ok: false, ms, err: err.message });
    }
  }
}

async function run() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║      COMPLIANCE SERVICE  ·  FULL API VALIDATION      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Query used : "${QUERY}"`);
  console.log(`  Timeout    : ${TIMEOUT / 1000}s per endpoint\n`);

  // ── 1. Etalab / Recherche Entreprises ─────────────────────
  await testApi(
    '1. Etalab – Recherche Entreprises',
    `https://recherche-entreprises.api.gouv.fr/search?q=Google&per_page=3&minimal=True`
  );

  // ── 2. Interpol Red Notices ────────────────────────────────
  await testApi(
    '2. Interpol – Red Notices',
    `https://ws-public.interpol.int/notices/v1/red?name=${QUERY}&resultPerPage=5`
  );

  // ── 3. World Bank Debarment ────────────────────────────────
  await testApi(
    '3. World Bank – Debarment Search',
    `https://search.worldbank.org/api/v3/wds?qterm=Google&format=json`
  );

  // ── 4. Gels des Avoirs – DG Trésor (JSON feed) ────────────
  await testApi(
    '4. Gels des Avoirs (DGTrésor) – JSON feed',
    `https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-fichier-json`,
    { timeout: 45000 }
  );

  // ── 5. Dilisense – Individual check (needs API key) ────────
  await testApi(
    '5. Dilisense – Individual (expects 401 without key)',
    `https://api.dilisense.com/v1/checkIndividual?names=${QUERY}`
  );

  // ── 6. Dilisense – Entity check (needs API key) ────────────
  await testApi(
    '6. Dilisense – Entity (expects 401 without key)',
    `https://api.dilisense.com/v1/checkEntity?names=${QUERY}`
  );

  // ── 7. Wikidata – Entity search ────────────────────────────
  await testApi(
    '7. Wikidata – Entity Search',
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=${QUERY}`,
    { headers: { 'User-Agent': 'ComplianceDashboard/1.0 (https://localhost:4200)' } }
  );

  // ── 8. LittleSis – Entity search ──────────────────────────
  await testApi(
    '8. LittleSis – Entity Search',
    `https://littlesis.org/api/entities/search?q=${QUERY}`
  );

  // ── 9. LittleSis – Relationships (sample entity id=1) ──────
  await testApi(
    '9. LittleSis – Relationships (entity #1)',
    `https://littlesis.org/api/entities/1/relationships`
  );

  // ── Summary ────────────────────────────────────────────────
  const line = '═'.repeat(56);
  console.log(`\n${line}`);
  console.log('  SUMMARY');
  console.log(line);
  const ok  = results.filter(r => r.ok);
  const bad = results.filter(r => !r.ok);
  console.log(`  ✅  ${ok.length} / ${results.length} endpoints reachable\n`);
  results.forEach(r => {
    const icon = r.ok ? '✅' : (String(r.status).startsWith('4') ? '⚠️ ' : '❌');
    const note = r.ok ? '' : `  ← ${r.err || r.status}`;
    console.log(`  ${icon}  [${String(r.status).padEnd(7)}] ${r.name}${note}`);
  });

  if (bad.length) {
    console.log(`\n  ACTION NEEDED:`);
    bad.forEach(r => {
      if (r.status === 401 || r.status === 403)
        console.log(`   • ${r.name}: Add API key to environment.ts`);
      else if (r.status === 'TIMEOUT')
        console.log(`   • ${r.name}: Endpoint too slow – review proxy timeout`);
      else if (r.status === 404)
        console.log(`   • ${r.name}: URL has changed – update endpoint in service`);
      else
        console.log(`   • ${r.name}: Investigate – status ${r.status}`);
    });
  }
  console.log(`\n${line}\n`);
}

run().catch(console.error);
