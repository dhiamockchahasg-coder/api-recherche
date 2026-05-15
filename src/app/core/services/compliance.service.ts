import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, timeout, map, shareReplay } from 'rxjs/operators';
export interface InterpolNotice {
  forename: string;
  name: string;
}

export interface InterpolResponse {
  total: number;
  _embedded: {
    notices: InterpolNotice[];
  };
}

export interface EtalabEntreprise {
  siren: string;
  nom_complet: string;
}

export interface EtalabResponse {
  results: EtalabEntreprise[];
  total_results: number;
}

export interface WorldBankDocument {
  display_title: string;
  docdt: string;
}

export interface WorldBankResponse {
  total: number;
  documents: { [key: string]: WorldBankDocument };
}

export interface LittleSisEntity {
  id: number;
  attributes: {
    name: string;
    blurb: string;
    primary_ext: string;
  };
}

export interface LittleSisResponse {
  data: LittleSisEntity[];
}
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
    fbi_wanted: '/api-proxy/fbi/wanted/v1/list',
    aleph: '/api-proxy/aleph/api/2/entities',
    wikidata_sparql: '/api-proxy/wikidata-sparql/sparql'
  };


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
    // Simplified: Focus on World Bank and Interpol as primary global sources
    return forkJoin({
      worldbank: this.searchWorldBank(query),
      interpol: this.searchInterpol(query)
    }).pipe(
      map(res => {
        const found = (res.worldbank.total > 0) || (res.interpol.total > 0);
        const sources = [
          ...(res.worldbank.total > 0 ? ['World Bank Debarred List'] : []),
          ...(res.interpol.total > 0 ? ['Interpol Red Notices'] : [])
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

}
