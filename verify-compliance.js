const { ComplianceCheck } = require('./compliance-aggregator');

async function runTests() {
    console.log('==========================================');
    console.log('   KYC/AML AGGREGATOR VERIFICATION');
    console.log('==========================================');

    const testNames = [
        "Mohamed",           // Common name for fuzzy testing
        "Vladimir Putin",   // Known PEP/Sanctioned
        "Google",           // Etalab company test
        "NonExistentName123" // Negative test
    ];

    for (const name of testNames) {
        try {
            const report = await ComplianceCheck(name);
            console.log(`\nRESULTS FOR: ${name}`);
            console.log(`- Hits: ${report.totalHits}`);
            console.log(`- DANGER: ${report.dangerColor} ${report.dangerLevel} [${report.dangerBar}] (${report.overallRiskScore}/100)`);
            console.log(`- Execution Time: ${report.executionTimeMs}ms`);
            
            if (report.warnings.length > 0) {
                console.warn(`- Warnings: ${report.warnings.join(', ')}`);
            }

            if (report.totalHits > 0) {
                report.results.forEach((r, i) => {
                    if (i < 3) { // Show top 3
                        console.log(`  [${i+1}] ${r.name} (${r.source}) - Score: ${r.matchScore}`);
                    }
                });
            } else {
                console.log('  No hits found.');
            }
        } catch (error) {
            console.error(`Error testing ${name}:`, error.message);
        }
    }

    console.log('\n==========================================');
    console.log('        VERIFICATION COMPLETE');
    console.log('==========================================');
}

runTests();
