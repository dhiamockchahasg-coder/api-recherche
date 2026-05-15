const PROXY_CONFIG = {
  "/api-proxy/interpol": {
    "target": "https://ws-public.interpol.int",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/interpol": "" },
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Referer": "https://www.interpol.int/"
    }
  },

  "/api-proxy/recherche-entreprises": {
    "target": "https://recherche-entreprises.api.gouv.fr",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/recherche-entreprises": "" }
  },
  "/api-proxy/littlesis": {
    "target": "https://littlesis.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/littlesis": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)"
    }
  },
  "/api-proxy/worldbank": {
    "target": "https://search.worldbank.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/worldbank": "" }
  },
  "/api-proxy/wikidata": {
    "target": "https://www.wikidata.org/w",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/wikidata": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)"
    }
  },
  "/api-proxy/fbi": {
    "target": "https://api.fbi.gov",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/fbi": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)"
    }
  },

  "/api-proxy/wikidata-sparql": {
    "target": "https://query.wikidata.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/wikidata-sparql": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)",
      "Accept": "application/sparql-results+json"
    }
  },

  "/api-proxy/sec": {
    "target": "https://efts.sec.gov",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/sec": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (compliance@example.com)"
    }
  },
  "/api-proxy/gleif": {
    "target": "https://api.gleif.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/gleif": "" }
  }
};

module.exports = PROXY_CONFIG;
