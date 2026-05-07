async function testApi(name, url, options = {}) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);
    try {
        const start = Date.now();
        const response = await fetch(url, {
            signal: AbortSignal.timeout(options.timeout || 30000),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ...options.headers
            },
            ...options
        });
        const duration = Date.now() - start;
        console.log(`Status: ${response.status} (${duration}ms)`);
        
        if (response.status === 401 || response.status === 403) {
            console.warn(`[AUTH] ${name} requires an API key or is blocked.`);
        } else if (response.ok) {
            const data = await response.text();
            try {
                // Try to parse as JSON for pretty printing
                const json = JSON.parse(data);
                console.log('Full JSON Response:');
                console.log(JSON.stringify(json, null, 2));
            } catch (e) {
                // Not JSON, just print the text
                console.log('Full Text Response:');
                console.log(data);
            }
        } else {
            console.error(`Error Status: ${response.status}`);
        }
        return true;
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.error(`Error: Connection timed out after ${options.timeout || 30000}ms`);
        } else {
            console.error(`Error: ${error.message}`);
        }
        return false;
    }
}

async function runAllTests() {
    console.log('==========================================');
    console.log('   LCB-FT API COMPREHENSIVE VALIDATION    ');
    console.log('==========================================\n');
    
    // 1. Etalab (Recherche Entreprises) - Public
    await testApi('Recherche Entreprises (Etalab)', 'https://recherche-entreprises.api.gouv.fr/search?q=google&per_page=1');

    // 2. Consolidated Screening List (CSL) - Free Global Sanctions
    await testApi('CSL (Global Sanctions)', 'https://api.trade.gov/gateway/v1/consolidated_screening_list/search?q=Putin');

    // 7. World Bank Debarred Providers - Free Corporate Compliance
    await testApi('World Bank (Debarred)', 'https://search.worldbank.org/api/v3/wds?qterm=google&format=json');

    // 3. Gel des Avoirs (France) - Public List (More stable than schema-json)
    await testApi('Gel des Avoirs (France)', 'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication', { timeout: 45000 });

    // 4. Interpol (Notices Rouges) - Public
    await testApi('Interpol (Notices Rouges)', 'https://ws-public.interpol.int/notices/v1/red?name=Putin');

    // 5. UK Sanctions List - Public
    await testApi('UK Sanctions List', 'https://www.gov.uk/government/publications/the-uk-sanctions-list');

    // 6. RNA (Associations) - Using Etalab (Unified search)
    await testApi('RNA (Associations)', 'https://recherche-entreprises.api.gouv.fr/search?q=W751217475');

    console.log('\n==========================================');
    console.log('           VALIDATION COMPLETE            ');
    console.log('==========================================');
}

runAllTests();
