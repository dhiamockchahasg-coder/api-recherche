import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { 
  LittleSisResponse, 
  EtalabResponse, 
  InterpolResponse, 
  WorldBankResponse 
} from '../../models/compliance.models';
import { environment } from '../../../environments/environment';
import { 
  MOCK_LITTLESIS, 
  MOCK_ETALAB, 
  MOCK_INTERPOL, 
  MOCK_WORLD_BANK 
} from '../mock-data';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private readonly endpoints = {
    littlesis: '/api-proxy/littlesis/api/entities/search',
    etalab: '/api-proxy/recherche-entreprises/search',
    interpol: 'https://ws-public.interpol.int/notices/v1/red',
    worldbank: '/api-proxy/worldbank/api/v3/wds'
  };

  constructor(private http: HttpClient) {}

  searchLittleSis(query: string): Observable<LittleSisResponse> {
    if (environment.useMocks) return of(MOCK_LITTLESIS);
    return this.http.get<LittleSisResponse>(this.endpoints.littlesis, { params: { q: query } }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of(MOCK_LITTLESIS))
    );
  }

  searchEtalab(query: string): Observable<EtalabResponse> {
    if (environment.useMocks) return of(MOCK_ETALAB);
    const params = new HttpParams().set('q', query).set('per_page', '5').set('minimal', 'True');
    return this.http.get<EtalabResponse>(this.endpoints.etalab, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of(MOCK_ETALAB))
    );
  }

  searchInterpol(name: string): Observable<InterpolResponse> {
    if (environment.useMocks) return of(MOCK_INTERPOL);
    return this.http.get<InterpolResponse>(this.endpoints.interpol, { params: { name } }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of(MOCK_INTERPOL))
    );
  }

  searchWorldBank(query: string): Observable<WorldBankResponse> {
    if (environment.useMocks) return of(MOCK_WORLD_BANK);
    const params = new HttpParams().set('qterm', query).set('format', 'json');
    return this.http.get<WorldBankResponse>(this.endpoints.worldbank, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of(MOCK_WORLD_BANK))
    );
  }
}
