
const MOCK_DATA = {
    results: [{ name: "MOCK DATA (API FAILED OR TIMED OUT)" }]
};

async function resilientFetch(name, url, timeout = 5000) {
    console.log(`\nTesting Resilient Logic for: ${name}`);
    console.log(`Targeting: ${url}`);
    
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success: Data retrieved from live API.`);
            return data;
        } else {
            throw new Error(`Status ${response.status}`);
        }
    } catch (error) {
        console.warn(`⚠️ Warning: Live API failed (${error.message}). Triggering Mock Fallback...`);
        return MOCK_DATA;
    }
}

async function runDemo() {
    console.log('=== SERVICE LOGIC SIMULATION ===');
    
    // 1. Test a working API
    await resilientFetch('Etalab (Working)', 'https://recherche-entreprises.api.gouv.fr/search?q=google&per_page=1');
    
    // 2. Test a failing API (OpenSanctions without key)
    const result = await resilientFetch('OpenSanctions (Failing)', 'https://api.opensanctions.org/search/default?q=test');
    console.log('Result for OpenSanctions:', JSON.stringify(result));
    
    // 3. Test a timeout (Simulated with short timeout)
    const timeoutResult = await resilientFetch('Slow API (Timeout Simulation)', 'https://httpbin.org/delay/5', 1000);
    console.log('Result for Slow API:', JSON.stringify(timeoutResult));

    console.log('\n=== Simulation Complete ===');
}

runDemo();
