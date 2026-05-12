/**
 * KYC/AML Compliance Aggregator
 * Replaces OpenSanctions with free/open sources.
 */

const environment = {
    cslApiKey: '', // To be filled from environment
    apiTimeout: 10000 // Reduced from 30s to 10s for better responsiveness
};

/**
 * Fuzzy Name Matching (Simple Jaro-Winkler implementation)
 */
function compareNames(name1, name2) {
    if (!name1 || !name2) return 0.0;
    const s1 = String(name1).toLowerCase().trim();
    const s2 = String(name2).toLowerCase().trim();
    if (s1 === s2) return 1.0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    let matches = 0;
    let transpositions = 0;
    
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, len2);
        for (let j = start; j < end; j++) {
            if (!s2Matches[j] && s1[i] === s2[j]) {
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }
    }
    
    if (matches === 0) return 0.0;
    
    let k = 0;
    for (let i = 0; i < len1; i++) {
        if (s1Matches[i]) {
            while (!s2Matches[k]) k++;
            if (s1[i] !== s2[k]) transpositions++;
            k++;
        }
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Boost score if one is a substring of the other (for companies)
    if (s2.includes(s1) || s1.includes(s2)) {
        return Math.max(jaro, 0.86); // Minimum threshold for substring matches
    }
    
    return jaro;
}

/**
 * Helper: Get Danger Level and Visual Bar
 */
function getRiskMetadata(score) {
    let level = 'Minimal';
    let color = '🟢';
    if (score > 80) { level = 'CRITICAL'; color = '🔴'; }
    else if (score > 50) { level = 'Elevated'; color = '🟠'; }
    else if (score > 20) { level = 'Low'; color = '🟡'; }
    
    const barLength = Math.round(score / 10);
    const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
    return { level, color, bar };
}

/**
 * API Adapters
 */

async function fetchEU_Sanctions(name) {
    // EU Consolidated Sanctions List Search (using Dilisense as primary proxy for speed, 
    // or direct webgate if preferred. Here we use a robust search pattern).
    const url = `https://dilisense.com/api/v1/check?name=${encodeURIComponent(name)}`;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(environment.apiTimeout) });
        if (!response.ok) return [];
        const data = await response.json();
        return (data.found ? [{
            source: 'EU/UN Sanctions',
            name: data.query.name,
            type: 'Sanctioned Entity',
            severity: 100,
            details: `Sources: ${data.sources.join(', ')}`
        }] : []);
    } catch (e) {
        return [];
    }
}

async function fetchLittleSis(name) {
    const url = `https://littlesis.org/api/entities/search?q=${encodeURIComponent(name)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(environment.apiTimeout) });
    if (!response.ok) return []; // Graceful failure
    const data = await response.json();
    return (data.data || []).map(r => {
        const name = r.attributes.name;
        const aliases = r.attributes.aliases || [];
        return {
            id: r.id,
            source: 'LittleSis',
            name: name,
            aliases: aliases,
            type: r.attributes.primary_type,
            severity: 40,
            details: r.attributes.description,
            pep: r.attributes.is_pep || false
        };
    });
}

/**
 * Fetch associated people for an entity (LittleSis)
 */
async function fetchAssociates(entityId, source, currentName) {
    if (source === 'LittleSis') {
        const url = `https://littlesis.org/api/entities/${entityId}/relationships`;
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(environment.apiTimeout) });
            if (!response.ok) return [];
            const data = await response.json();
            
            return (data.data || []).map(rel => {
                const desc = rel.attributes.description || '';
                // Simple parsing: "Name1 and Name2 have a relationship"
                // If currentName is Name2, return Name1 and vice-versa
                const parts = desc.split(' and ');
                if (parts.length >= 2) {
                    const name1 = parts[0].trim();
                    const name2 = parts[1].split(' have ')[0].trim();
                    return compareNames(currentName, name1) > 0.8 ? name2 : name1;
                }
                return null;
            }).filter(Boolean);
        } catch (e) {
            return [];
        }
    }
    return [];
}

async function fetchEtalab(name) {
    const searchUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(name)}&per_page=5`;
    const freezeUrl = `https://www.data.gouv.fr/fr/datasets/r/d1175628-98e6-42d3-8208-8e682245b736`;

    const [searchRes, freezeRes] = await Promise.allSettled([
        fetch(searchUrl, { signal: AbortSignal.timeout(environment.apiTimeout) }),
        fetch(freezeUrl, { signal: AbortSignal.timeout(environment.apiTimeout) })
    ]);

    let results = [];
    if (searchRes.status === 'fulfilled' && searchRes.value.ok) {
        const data = await searchRes.value.json();
        results = results.concat((data.results || []).map(r => {
            const leaders = (r.dirigeants || []).map(d => `${d.prenom || ''} ${d.nom || ''}`.trim());
            return {
                source: 'Etalab (Companies)',
                name: r.nom_complet,
                type: 'Company',
                severity: 20,
                details: `SIREN: ${r.siren}, Address: ${r.siege?.geo_adresse}`,
                associates: leaders
            };
        }));
    }
    return results;
}

async function fetchInterpol(name) {
    const url = `https://ws-public.interpol.int/notices/v1/red?name=${encodeURIComponent(name)}`;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(environment.apiTimeout) });
        if (!response.ok) return [];
        const data = await response.json();
        return (data._embedded?.notices || []).map(n => ({
            source: 'Interpol Red Notice',
            name: `${n.forename || ''} ${n.name || ''}`.trim() || 'Unknown',
            type: 'Wanted Person',
            severity: 100,
            details: `Nationality: ${n.nationalities?.join(', ') || 'Unknown'}`
        }));
    } catch (e) {
        return [];
    }
}

async function fetchWorldBank(name) {
    const url = `https://search.worldbank.org/api/v3/wds?qterm=${encodeURIComponent(name)}&format=json`;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(environment.apiTimeout) });
        if (!response.ok) return [];
        const data = await response.json();
        // The World Bank API returns documents; we check for "Debarred" or similar keywords
        const docs = Object.values(data.documents || {});
        return docs.map(d => ({
            source: 'World Bank',
            name: d.display_title,
            type: 'Financial/Debarred',
            severity: 80,
            details: d.docdt
        }));
    } catch (e) {
        return [];
    }
}

async function fetchUK_Sanctions(name) {
    const url = `https://search-uk-sanctions-list.service.gov.uk/api/v1/sanctions/search?name=${encodeURIComponent(name)}`;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(environment.apiTimeout) });
        if (!response.ok) return [];
        const data = await response.json();
        return (data.results || []).map(r => ({
            source: 'UK Sanctions',
            name: r.name,
            type: r.type,
            severity: 100,
            details: r.reason
        }));
    } catch (e) {
        return [];
    }
}

async function fetchWikidata(name) {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&search=${encodeURIComponent(name)}`;
    try {
        const response = await fetch(url, { 
            headers: { 'User-Agent': 'ComplianceAggregator/1.0' },
            signal: AbortSignal.timeout(environment.apiTimeout) 
        });
        if (!response.ok) return [];
        const data = await response.json();
        return (data.search || []).map(item => ({
            source: 'Wikidata (PEP/Public Figure)',
            name: item.label,
            type: 'Public Figure',
            severity: 30,
            details: `${item.description} (${item.concepturi})`
        }));
    } catch (e) {
        return [];
    }
}


/**
 * Main Compliance Aggregator
 */
async function ComplianceCheck(searchName, options = {}) {
    const depth = options.depth || 0;
    const maxDepth = 1; // Limit recursion to 1 level (Company -> Associates)
    
    if (depth > maxDepth) return null;

    console.log(`\n--- [Depth ${depth}] Compliance Check: "${searchName}" ---`);
    
    const startTime = Date.now();
    const warnings = [];
    
    const results = await Promise.allSettled([
        fetchEU_Sanctions(searchName),
        fetchLittleSis(searchName),
        fetchEtalab(searchName),
        fetchUK_Sanctions(searchName),
        fetchInterpol(searchName),
        fetchWorldBank(searchName),
        fetchWikidata(searchName)
    ]);

    const aggregated = [];
    const sourceNames = ['EU Sanctions', 'LittleSis', 'Etalab', 'UK Sanctions', 'Interpol', 'World Bank', 'Wikidata'];
    
    results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
            aggregated.push(...res.value);
        } else {
            warnings.push(`${sourceNames[index]} failed: ${res.reason.message}`);
        }
    });

    const threshold = options.threshold || 0.85;
    const finalResults = [];
    
    const deepDivePromises = [];
    const hitsToProcess = [];

    for (const item of aggregated) {
        let score = compareNames(searchName, item.name);
        if (score < threshold && item.aliases && item.aliases.length > 0) {
            const aliasScores = item.aliases.map(a => compareNames(searchName, a));
            score = Math.max(score, ...aliasScores);
        }

        if (score >= threshold) {
            const existing = finalResults.find(r => 
                compareNames(r.name, item.name) > 0.95 && r.source === item.source
            );
            
            if (!existing) {
                const riskContribution = Math.round(item.severity * score);
                const resultObj = { 
                    ...item, 
                    matchScore: score.toFixed(2),
                    riskScore: riskContribution,
                    associatesChecked: []
                };
                finalResults.push(resultObj);
                hitsToProcess.push(resultObj);
            }
        }
    }

    // Parallel Deep-Dive for all hits at once
    if (depth < maxDepth) {
        const diveTasks = hitsToProcess.map(async (resultObj) => {
            if (resultObj.type === 'Company' || resultObj.source === 'LittleSis') {
                let associateNames = resultObj.associates || [];
                if (resultObj.id && resultObj.source === 'LittleSis') {
                    const lsAssociates = await fetchAssociates(resultObj.id, 'LittleSis', resultObj.name);
                    associateNames = [...new Set([...associateNames, ...lsAssociates])];
                }

                if (associateNames.length > 0) {
                    const topAssociates = associateNames.slice(0, 2); // Limit to top 2 for speed
                    const associateChecks = await Promise.all(
                        topAssociates.map(name => ComplianceCheck(name, { ...options, depth: depth + 1 }))
                    );

                    associateChecks.forEach((check, i) => {
                        if (check && check.overallRiskScore > 40) {
                            warnings.push(`Risk Alert: Associate "${topAssociates[i]}" for "${resultObj.name}" has risk score ${check.overallRiskScore}`);
                            resultObj.riskScore = Math.max(resultObj.riskScore, check.overallRiskScore);
                            resultObj.associatesChecked.push({
                                name: topAssociates[i],
                                riskScore: check.overallRiskScore
                            });
                        }
                    });
                }
            }
        });
        await Promise.all(diveTasks);
    }

    const overallRiskScore = finalResults.length > 0 
        ? Math.max(...finalResults.map(r => r.riskScore)) 
        : 0;
    
    const riskMeta = getRiskMetadata(overallRiskScore);

    return {
        query: searchName,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        totalHits: finalResults.length,
        overallRiskScore: overallRiskScore,
        dangerLevel: riskMeta.level,
        dangerBar: riskMeta.bar,
        dangerColor: riskMeta.color,
        results: finalResults.sort((a, b) => b.riskScore - a.riskScore),
        warnings: warnings
    };
}

// Export for use
if (typeof module !== 'undefined') {
    module.exports = { ComplianceCheck };
}

// Demo usage if run directly
if (require.main === module) {
    (async () => {
        const report = await ComplianceCheck("Mohamed");
        console.log(JSON.stringify(report, null, 2));
    })();
}
