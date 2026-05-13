const PROXY_CONFIG = {
  "/api-proxy/dilisense": {
    "target": "https://api.dilisense.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/dilisense": "" }
  },
  "/api-proxy/interpol": {
    "target": "https://ws-public.interpol.int",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/interpol": "" },
    "headers": {
      "User-Agent": "ComplianceDashboard/1.0 (https://localhost:4200)"
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
  "/api-proxy/opencorporates": {
    "target": "https://api.opencorporates.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/opencorporates": "" }
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
    "followRedirects": true,
    "onProxyRes": function (proxyRes, req, res) {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        console.log('Redirecting to:', proxyRes.headers.location);
      }
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
  "/api-proxy/aleph": {
    "target": "https://aleph.occrp.org",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api-proxy/aleph": "" }
  }
};

module.exports = PROXY_CONFIG;
