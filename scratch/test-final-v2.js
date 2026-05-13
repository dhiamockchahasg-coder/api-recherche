
async function test() {
  const query = 'Putin';
  const baseUrl = 'http://localhost:4200/api-proxy';
  const endpoints = [
    { name: 'Interpol', url: `${baseUrl}/interpol/notices/v1/red?name=${query}` },
    { name: 'UN Sanctions', url: `${baseUrl}/un-sanctions/resources/xml/en/consolidated.xml` },
    { name: 'Trade.gov CSL', url: `${baseUrl}/csl/static/consolidated_screening_list/consolidated.json` },
    { name: 'FBI Wanted', url: `${baseUrl}/fbi/wanted/v1/list?title=${query}` },
    { name: 'DGTrésor (FR)', url: `${baseUrl}/gels-avoirs/ApiPublic/api/v1/publication/derniere-publication-fichier-json` },
    { name: 'World Bank', url: `${baseUrl}/worldbank/api/v3/wds?qterm=Google&format=json` },
    { name: 'Etalab (FR)', url: `${baseUrl}/recherche-entreprises/search?q=Google` },
    { name: 'LittleSis', url: `${baseUrl}/littlesis/api/entities/search?q=${query}` },
    { name: 'OCCRP Aleph', url: `${baseUrl}/aleph/api/2/entities?q=Google` },
    { name: 'Wikidata', url: `${baseUrl}/wikidata/api.php?action=wbsearchentities&search=${query}&language=en&format=json` }
  ];

  console.log('--- FINAL API VALIDATION ---');
  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const res = await fetch(ep.url);
      console.log(`${res.ok ? '✅' : '❌'} [${res.status}] ${ep.name.padEnd(15)} (${Date.now() - t0}ms)`);
    } catch (e) {
      console.log(`❌ [ERR] ${ep.name.padEnd(15)} - ${e.message}`);
    }
  }
}
test();
