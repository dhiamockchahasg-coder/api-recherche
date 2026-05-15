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

    worldbank: '/api-proxy/worldbank/api/v2/wds',
    wikidata: '/api-proxy/wikidata/api.php',
    littlesis_rels: '/api-proxy/littlesis/api/entities',
    fbi_wanted: '/api-proxy/fbi/wanted/v1/list',
    wikidata_sparql: '/api-proxy/wikidata-sparql/sparql',
    sec_search: '/api-proxy/sec/LATEST/search-index',
    gleif: '/api-proxy/gleif/api/v1/lei-records'
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
    return this.http.get<InterpolResponse>(this.endpoints.interpol, { params: { name } }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, _embedded: { notices: [] } }))
    );
  }

  searchFBI(query: string): Observable<any> {
    const params = new HttpParams().set('title', query);
    return this.http.get<any>(this.endpoints.fbi_wanted, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, items: [] }))
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
        SERVICE wikibase:mwapi {
            bd:serviceParam wikibase:api "EntitySearch" .
            bd:serviceParam wikibase:endpoint "www.wikidata.org" .
            bd:serviceParam mwapi:search "${query}" .
            bd:serviceParam mwapi:language "en" .
            ?person wikibase:apiOutputItem mwapi:item .
        }
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



  searchWorldBank(query: string): Observable<WorldBankResponse> {
    const params = new HttpParams().set('qterm', query).set('format', 'json');
    return this.http.get<WorldBankResponse>(this.endpoints.worldbank, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, documents: {} }))
    );
  }

  searchSEC(query: string): Observable<any> {
    const params = new HttpParams().set('q', query);
    return this.http.get<any>(this.endpoints.sec_search, { params }).pipe(
      timeout(15000),
      catchError(() => of({ hits: { hits: [] } }))
    );
  }

  searchGLEIF(query: string): Observable<any> {
    const params = new HttpParams().set('filter[entity.legalName]', query);
    return this.http.get<any>(this.endpoints.gleif, { params }).pipe(
      timeout(15000),
      catchError(() => of({ data: [] }))
    );
  }

}
