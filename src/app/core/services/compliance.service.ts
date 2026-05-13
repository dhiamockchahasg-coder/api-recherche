import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, timeout, map, shareReplay } from 'rxjs/operators';
import {
  LittleSisResponse,
  EtalabResponse,
  InterpolResponse,
  WorldBankResponse,
  GelAvoirsResponse
} from '../../models/compliance.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private readonly endpoints = {
    littlesis: '/api-proxy/littlesis/api/entities/search',
    etalab: '/api-proxy/recherche-entreprises/search',
    interpol: '/api-proxy/interpol/notices/v1/red',
    worldbank: '/api-proxy/worldbank/api/v3/wds',
    wikidata: '/api-proxy/wikidata/api.php',
    littlesis_rels: '/api-proxy/littlesis/api/entities',
    gels_avoirs: '/api-proxy/gels-avoirs/ApiPublic/api/v1/publication/derniere-publication-fichier-json',
    un_sanctions: '/api-proxy/un-sanctions/resources/xml/en/consolidated.xml',
    fbi_wanted: '/api-proxy/fbi/wanted/v1/list',
    aleph: '/api-proxy/aleph/api/2/entities',
    csl: '/api-proxy/csl/static/consolidated_screening_list/consolidated.json',
    opensanctions: '/api-proxy/opensanctions/match/default',
    eu_sanctions: '/api-proxy/eu-sanctions/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content',
    opencorporates: '/api-proxy/opencorporates/v0.4/companies/search',
    icij: '/api-proxy/icij/api/v1/reconcile/pandora-papers',
    wikidata_sparql: '/api-proxy/wikidata-sparql/sparql',
    inpi_rbe: '/api-proxy/inpi/entreprises'
  };

  // Cache for large static feeds
  private cslCache$?: Observable<any>;
  private frenchCache$?: Observable<any>;

  constructor(private http: HttpClient) { }

  searchLittleSis(query: string): Observable<LittleSisResponse> {
    return this.http.get<LittleSisResponse>(this.endpoints.littlesis, { params: { q: query } }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ data: [] }))
    );
  }

  searchEtalab(query: string): Observable<EtalabResponse> {
    const params = new HttpParams().set('q', query).set('per_page', '5').set('minimal', 'True');
    return this.http.get<EtalabResponse>(this.endpoints.etalab, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ results: [], total_results: 0 }))
    );
  }

  searchInterpol(name: string): Observable<InterpolResponse> {
    // Interpol API is sensitive; headers are handled by proxy.conf.js
    return this.http.get<InterpolResponse>(this.endpoints.interpol, { params: { name } }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, _embedded: { notices: [] } }))
    );
  }

  searchWorldBank(query: string): Observable<WorldBankResponse> {
    const params = new HttpParams().set('qterm', query).set('format', 'json');
    return this.http.get<WorldBankResponse>(this.endpoints.worldbank, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, documents: {} }))
    );
  }

  searchGlobalSanctions(query: string): Observable<any> {
    return forkJoin({
      french: this.searchFrenchSanctions(query),
      un: this.searchUNSanctions(query),
      eu: this.searchEUSanctions(query),
      opensanctions: this.searchOpenSanctions(query),
      csl: this.searchCSL(query)
    }).pipe(
      map(res => {
        const found = (res.french.publications?.length > 0) || 
                      res.un.found || 
                      res.eu.found ||
                      (res.opensanctions?.responses?.q1?.results?.length > 0) ||
                      (res.csl.total > 0);
        
        const sources = [
          ...(res.french.publications?.length ? ['French National (DGTrésor)'] : []),
          ...(res.un.found ? ['United Nations (UNSC)'] : []),
          ...(res.eu.found ? ['European Union (CFSP)'] : []),
          ...(res.opensanctions?.responses?.q1?.results?.length ? ['OpenSanctions (Global)'] : []),
          ...(res.csl.results?.map((item: any) => item.source) || [])
        ];

        return {
          found,
          query,
          sources: [...new Set(sources)],
          details: res
        };
      }),
      catchError(err => {
        console.error('Global Sanctions Error:', err);
        return of({ found: false, sources: [], details: {} });
      })
    );
  }

  searchFrenchSanctions(query: string): Observable<GelAvoirsResponse> {
    if (!this.frenchCache$) {
      this.frenchCache$ = this.http.get<any>(this.endpoints.gels_avoirs).pipe(
        shareReplay(1),
        catchError(() => of(null))
      );
    }

    return this.frenchCache$.pipe(
      map(response => {
        if (!response) return { publications: [] };
        const all = response?.Publications?.PublicationDetail || [];
        const q = query.toLowerCase().trim();
        const filtered = all.filter((p: any) => {
          const nom = (p.Nom || '').toLowerCase();
          const details = p.RegistreDetail || [];
          const aliases = details
            .filter((d: any) => d.TypeChamp === 'ALIAS' || d.TypeChamp === 'PRENOM')
            .flatMap((d: any) => (d.Valeur || []).map((v: any) => (v.Alias || v.Prenom || '').toLowerCase()));
          return nom.includes(q) || aliases.some((a: string) => a.includes(q));
        });
        return {
          publications: filtered.slice(0, 5).map((p: any) => ({
            id: p.IdRegistre?.toString(),
            nom: p.Nom,
            motif: p.RegistreDetail?.find((d: any) => d.TypeChamp === 'MOTIFS')?.Valeur?.[0]?.Motif || ''
          }))
        };
      })
    );
  }

  searchUNSanctions(query: string): Observable<any> {
    return this.http.get(this.endpoints.un_sanctions, { responseType: 'text' }).pipe(
      map(xmlString => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const q = query.toLowerCase().trim();
        
        // Comprehensive search in FIRST_NAME, SECOND_NAME, and COMMENTS
        const elements = Array.from(xmlDoc.querySelectorAll('FIRST_NAME, SECOND_NAME, COMMENTS, NATIONALITY'));
        const matches = elements.filter(el => el.textContent?.toLowerCase().includes(q));

        return {
          found: matches.length > 0,
          matches: [...new Set(matches.slice(0, 5).map(m => m.textContent?.trim()))]
        };
      }),
      catchError(() => of({ found: false, matches: [] }))
    );
  }

  searchCSL(query: string): Observable<any> {
    if (!this.cslCache$) {
      this.cslCache$ = this.http.get<any>(this.endpoints.csl).pipe(
        shareReplay(1),
        catchError(() => of({ results: [] }))
      );
    }

    return this.cslCache$.pipe(
      map(response => {
        const all = response.results || [];
        const q = query.toLowerCase().trim();
        const matches = all.filter((item: any) => 
          (item.name || '').toLowerCase().includes(q) || 
          (item.alt_names || []).some((alt: string) => alt.toLowerCase().includes(q))
        );
        return { total: matches.length, results: matches.slice(0, 10) };
      })
    );
  }

  searchFBI(query: string): Observable<any> {
    const params = new HttpParams().set('title', query);
    return this.http.get<any>(this.endpoints.fbi_wanted, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, items: [] }))
    );
  }

  searchAleph(query: string): Observable<any> {
    const params = new HttpParams().set('q', query).set('limit', '5');
    return this.http.get<any>(this.endpoints.aleph, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, results: [] }))
    );
  }

  searchWikidata(query: string): Observable<any> {
    const params = new HttpParams()
      .set('action', 'wbsearchentities')
      .set('language', 'en')
      .set('format', 'json')
      .set('search', query);

    return this.http.get<any>(this.endpoints.wikidata, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ search: [] }))
    );
  }

  searchAssociates(entityId: string): Observable<any> {
    const url = `${this.endpoints.littlesis_rels}/${entityId}/relationships`;
    return this.http.get<any>(url).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ data: [] }))
    );
  }

  searchOpenSanctions(query: string): Observable<any> {
    const body = {
      queries: {
        q1: {
          schema: "Person",
          properties: {
            name: [query]
          }
        }
      }
    };
    return this.http.post<any>(this.endpoints.opensanctions, body).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ responses: { q1: { results: [] } } }))
    );
  }

  searchEUSanctions(query: string): Observable<any> {
    return this.http.get(this.endpoints.eu_sanctions, { responseType: 'text' }).pipe(
      map(xmlString => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const q = query.toLowerCase().trim();
        
        // Search in nameAlias and other relevant tags
        const nameAliases = Array.from(xmlDoc.querySelectorAll('nameAlias'));
        const matches = nameAliases.filter(el => {
          const firstName = el.getAttribute('firstName')?.toLowerCase() || '';
          const lastName = el.getAttribute('lastName')?.toLowerCase() || '';
          const wholeName = el.getAttribute('wholeName')?.toLowerCase() || '';
          return firstName.includes(q) || lastName.includes(q) || wholeName.includes(q);
        });

        return {
          found: matches.length > 0,
          matches: matches.slice(0, 5).map(m => m.getAttribute('wholeName') || m.getAttribute('lastName') || 'Unknown')
        };
      }),
      catchError(() => of({ found: false, matches: [] }))
    );
  }

  searchOpenCorporates(query: string): Observable<any> {
    return this.http.get<any>(this.endpoints.opencorporates, { params: { q: query } }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ results: { total_count: 0, companies: [] } }))
    );
  }

  searchICIJ(query: string): Observable<any> {
    const body = {
      queries: {
        q1: { query }
      }
    };
    return this.http.post<any>(this.endpoints.icij, body).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ q1: { result: [] } }))
    );
  }

  searchWikidataPEP(query: string): Observable<any> {
    const sparql = `
      SELECT ?person ?personLabel ?positionLabel WHERE {
        ?person wdt:P31 wd:Q5.
        ?person ?labelProp "${query}"@en.
        ?person p:P39 ?statement.
        ?statement ps:P39 ?position.
        ?position wdt:P279* wd:Q22631.
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      } LIMIT 5
    `;
    const params = new HttpParams().set('query', sparql).set('format', 'json');
    return this.http.get<any>(this.endpoints.wikidata_sparql, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ results: { bindings: [] } }))
    );
  }

  getBeneficiairesEffectifs(siren: string): Observable<any> {
    const url = `${this.endpoints.inpi_rbe}/${siren}/beneficiaires-effectifs`;
    return this.http.get<any>(url).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ beneficiaires_effectifs: [] }))
    );
  }
}
