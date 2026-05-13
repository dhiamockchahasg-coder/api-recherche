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
  "/api-proxy/gels-avoirs": {
    "target": "https://gels-avoirs.dgtresor.gouv.fr",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/gels-avoirs": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)",
      "Accept": "application/json"
    }
  },
  "/api-proxy/un-sanctions": {
    "target": "https://scsanctions.un.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/un-sanctions": "" },
    "followRedirects": true
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
  "/api-proxy/aleph": {
    "target": "https://aleph.occrp.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/aleph": "" }
  },
  "/api-proxy/csl": {
    "target": "https://api.trade.gov",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/csl": "" }
  },
  "/api-proxy/uk-sanctions": {
    "target": "https://ofsistorage.blob.core.windows.net",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/uk-sanctions": "" }
  },
  "/api-proxy/opensanctions": {
    "target": "https://api.opensanctions.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/opensanctions": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)"
    }
  },
  "/api-proxy/eu-sanctions": {
    "target": "https://webgate.ec.europa.eu",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/eu-sanctions": "" },
    "followRedirects": true
  },
  "/api-proxy/inpi": {
    "target": "https://api.inpi.fr",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/inpi": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)"
    }
  },
  "/api-proxy/opencorporates": {
    "target": "https://api.opencorporates.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/opencorporates": "" }
  },
  "/api-proxy/icij": {
    "target": "https://offshoreleaks.icij.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/icij": "" }
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
  }
};

module.exports = PROXY_CONFIG;
