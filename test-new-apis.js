
async function test(name, url) {
    console.log('\n--- ' + name + ' ---');
    try {
        const r = await fetch(url, {
            signal: AbortSignal.timeout(15000),
            headers: { 'Accept': 'application/json, text/xml, */*' }
        });
        console.log('STATUS:', r.status);
        const txt = await r.text();
        console.log('PREVIEW:', txt.substring(0, 400));
    } catch (e) {
        console.log('ERROR:', e.message);
    }
}

(async () => {
    // 1. OFAC SDN - US Treasury (XML format)
    await test('OFAC SDN (US Treasury)', 'https://www.treasury.gov/ofac/downloads/sdn.xml');

    // 2. UN Consolidated Sanctions (XML)
    await test('UN Consolidated Sanctions', 'https://scsanctions.un.org/resources/xml/en/consolidated.xml');

    // 3. EU Sanctions - data.europa.eu correct endpoint
    await test('EU Sanctions Data', 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw');

    // 4. Wikidata PEP - politicians/heads of state (SPARQL) - separate file to avoid escape issues
    const wikidataUrl = 'https://query.wikidata.org/sparql?format=json&query=SELECT%20%3Fitem%20%3FitemLabel%20WHERE%20%7B%20%3Fitem%20wdt%3AP31%20wd%3AQ5.%20%3Fitem%20wdt%3AP106%20wd%3AQ82955.%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22fr%22.%20%7D%20%7D%20LIMIT%205';
    await test('Wikidata PEP (Politicians)', wikidataUrl);
})();
