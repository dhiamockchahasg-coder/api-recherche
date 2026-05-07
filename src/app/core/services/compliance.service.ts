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
    interpol: 'https://ws-public.interpol.int/notices/v1/red',
    worldbank: '/api-proxy/worldbank/api/v3/wds',
    csl: '/api-proxy/csl/gateway/v1/consolidated_screening_list/search',
    opencorporates: '/api-proxy/opencorporates/v0.4/companies/search'
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

  searchCSL(query: string): Observable<CSLResponse> {
    let params = new HttpParams().set('q', query);
    if (environment.cslApiKey) {
      params = params.set('api_key', environment.cslApiKey);
    }
    return this.http.get<CSLResponse>(this.endpoints.csl, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ total: 0, results: [] }))
    );
  }

  searchOpenCorporates(query: string): Observable<OpenCorporatesResponse> {
    let params = new HttpParams().set('q', query);
    if (environment.openCorporatesApiKey) {
      params = params.set('api_token', environment.openCorporatesApiKey);
    }
    return this.http.get<OpenCorporatesResponse>(this.endpoints.opencorporates, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ results: { total_count: 0, companies: [] } }))
    );
  }
}
