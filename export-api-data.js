
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'api-results-log.txt');

// Clear the log file at the start
fs.writeFileSync(LOG_FILE, '=== LCB-FT API DATA EXPORT LOG ===\nGenerated at: ' + new Date().toLocaleString() + '\n\n');

async function testApi(name, url, options = {}) {
    const logEntry = [];
    logEntry.push(`--- Testing ${name} ---`);
    logEntry.push(`[INPUT URL]: ${url}`);
    logEntry.push(`[INPUT OPTIONS]: ${JSON.stringify(options)}`);

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
        logEntry.push(`[STATUS]: ${response.status} (${duration}ms)`);
        
        const data = await response.text();
        logEntry.push(`[OUTPUT]:`);
        try {
            // Try to format JSON
            const json = JSON.parse(data);
            logEntry.push(JSON.stringify(json, null, 2));
        } catch (e) {
            // Not JSON
            logEntry.push(data.substring(0, 2000) + '... (truncated if long)');
        }
    } catch (error) {
        logEntry.push(`[ERROR]: ${error.message}`);
    }

    logEntry.push('\n' + '='.repeat(50) + '\n');
    
    const output = logEntry.join('\n');
    console.log(`Finished ${name}`);
    fs.appendFileSync(LOG_FILE, output);
}

async function runExport() {
    console.log('Exporting API data to api-results-log.txt...');
    
    // 1. Recherche Entreprises (Etalab) - Fixed with minimal=True
    await testApi('Recherche Entreprises (Etalab)', 'https://recherche-entreprises.api.gouv.fr/search?q=google&per_page=1&minimal=True');

    // 2. Consolidated Screening List (CSL) - Still likely HTML without key, but trying one more variation
    await testApi('CSL (Global Sanctions)', 'https://api.trade.gov/gateway/v1/consolidated_screening_list/search?q=Putin', {
        headers: { 'Accept': 'application/json' }
    });

    // 3. World Bank Debarred Providers - Specific search for debarred firms
    await testApi('World Bank (Debarred)', 'https://search.worldbank.org/api/v3/wds?qterm=debarred+firms&format=json');

    // 4. LittleSis (Free alternative to OpenSanctions)
    await testApi('LittleSis (Political/Corporate)', 'https://littlesis.org/api/entities/search?q=Google');

    // 5. Gel des Avoirs (France - DGTresor) - Using FLUX-JSON for actual data
    await testApi('Gel des Avoirs (France - Data)', 'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/flux-json');

    // 6. Interpol (Notices Rouges)
    await testApi('Interpol (Notices Rouges)', 'https://ws-public.interpol.int/notices/v1/red?name=Putin');

    // 7. UK Sanctions List - Attempting to find a more direct data link if possible
    // Note: Usually a CSV download, testing if they have a JSON proxy
    await testApi('UK Sanctions List (Direct)', 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1100000/UK_Sanctions_List.csv');

    // 8. RNA (Associations - Redirected to Etalab version)
    await testApi('RNA (Associations)', 'https://recherche-entreprises.api.gouv.fr/search?q=W751217475&minimal=True');

    console.log('Export complete! Check api-results-log.txt');
}

runExport();
