import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { 
  LittleSisResponse, 
  EtalabResponse, 
  InterpolResponse, 
  WorldBankResponse,
  CSLResponse,
  OpenCorporatesResponse
} from '../../models/compliance.models';
import { environment } from '../../../environments/environment';
import { 
  MOCK_LITTLESIS, 
  MOCK_ETALAB, 
  MOCK_INTERPOL, 
  MOCK_WORLD_BANK,
  MOCK_CSL,
  MOCK_OPENCORPORATES
} from '../mock-data';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private readonly endpoints = {
    littlesis: '/api-proxy/littlesis/api/entities/search',
    etalab: '/api-proxy/recherche-entreprises/search',
    interpol: '/api-proxy/interpol/notices/v1/red',
    worldbank: '/api-proxy/worldbank/api/v3/wds',
    eu_sanctions: '/api-proxy/dilisense/api/v1/check',
    wikidata: '/api-proxy/wikidata/api.php'
  };

  constructor(private http: HttpClient) {}

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

  searchWorldBank(query: string): Observable<WorldBankResponse> {
    const params = new HttpParams().set('qterm', query).set('format', 'json');
    return this.http.get<WorldBankResponse>(this.endpoints.worldbank, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, documents: {} }))
    );
  }

  searchEU_Sanctions(query: string): Observable<any> {
    const params = new HttpParams().set('name', query);
    return this.http.get<any>(this.endpoints.eu_sanctions, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ found: false }))
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
}
