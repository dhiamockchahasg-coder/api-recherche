import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';
import { 
  LittleSisResponse, 
  EtalabResponse, 
  InterpolResponse, 
  WorldBankResponse,
  CSLResponse,
  OpenCorporatesResponse,
  GelAvoirsResponse
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
    dilisense_individual: '/api-proxy/dilisense/v1/checkIndividual',
    dilisense_entity: '/api-proxy/dilisense/v1/checkEntity',
    wikidata: '/api-proxy/wikidata/api.php',
    littlesis_rels: '/api-proxy/littlesis/api/entities',
    gels_avoirs: '/api-proxy/gels-avoirs/ApiPublic/api/v1/publication/derniere-publication-fichier-json',
    un_sanctions: '/api-proxy/un-sanctions/resources/xml/en/consolidated.xml',
    opencorporates: '/api-proxy/opencorporates/v0.4',
    fbi_wanted: '/api-proxy/fbi/wanted/v1/list',
    aleph: '/api-proxy/aleph/api/2/entities'
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
    const params = new HttpParams().set('names', query);
    
    // Dilisense REQUIRES an API Key in the headers
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (environment.dilisenseApiKey) {
      headers['x-api-key'] = environment.dilisenseApiKey;
    }

    // Aggregating French National and UN Global sources
    return forkJoin({
      /* individual: this.http.get<any>(this.endpoints.dilisense_individual, { params, headers }).pipe(
        catchError(() => of({ found: false, matches: [] }))
      ),
      entity: this.http.get<any>(this.endpoints.dilisense_entity, { params, headers }).pipe(
        catchError(() => of({ found: false, matches: [] }))
      ), */
      french: this.searchFrenchSanctions(query).pipe(
        catchError(() => of({ publications: [] }))
      ),
      un: this.searchUNSanctions(query).pipe(
        catchError(() => of({ found: false, matches: [] }))
      )
    }).pipe(
      timeout(environment.apiTimeout),
      map((res: { /* individual: any, entity: any, */ french: GelAvoirsResponse, un: any }) => {
        const found = /* res.individual.found || res.entity.found || */ 
                      (res.french.publications && res.french.publications.length > 0) ||
                      res.un.found;
                      
        const sources = [
          /* ...(res.individual.sources || []), 
          ...(res.entity.sources || []), */
          ...(res.french.publications ? res.french.publications.map(() => 'French National Registry (DGTresor)') : []),
          ...(res.un.found ? ['United Nations Security Council'] : [])
        ];
        
        return {
          found,
          query: { name: query },
          sources: [...new Set(sources)],
          details: {
            /* individual: res.individual,
            entity: res.entity, */
            french: res.french,
            un: res.un
          }
        };
      }),
      catchError((error) => {
        console.error('Sanctions API Error:', error);
        return of({ found: false, matches: [] });
      })
    );
  }

  searchFrenchSanctions(query: string): Observable<GelAvoirsResponse> {
    return this.http.get<any>(this.endpoints.gels_avoirs).pipe(
      timeout(8000), // Prevent large 5MB JSON from blocking the UI indefinitely
      map(response => {
        const all = response?.Publications?.PublicationDetail || [];
        const q = query.toLowerCase().trim();
        
        const filtered = all.filter((p: any) => {
          const nom = (p.Nom || '').toLowerCase();
          
          // Get all aliases and names from RegistreDetail
          const details = p.RegistreDetail || [];
          const names = details
            .filter((d: any) => d.TypeChamp === 'PRENOM' || d.TypeChamp === 'ALIAS')
            .flatMap((d: any) => (d.Valeur || []).map((v: any) => (v.Prenom || v.Alias || '').toLowerCase()));
          
          return nom.includes(q) || names.some((n: string) => n.includes(q));
        });

        return { 
          publications: filtered.map((p: any) => ({
            id: p.IdRegistre?.toString(),
            nom: p.Nom,
            prenom: p.RegistreDetail?.find((d: any) => d.TypeChamp === 'PRENOM')?.Valeur?.[0]?.Prenom || '',
            motif: p.RegistreDetail?.find((d: any) => d.TypeChamp === 'MOTIFS')?.Valeur?.[0]?.Motif || ''
          }))
        };
      }),
      catchError((err) => {
        console.error('French Sanctions Fetch Error:', err);
        return of({ publications: [] });
      })
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

  searchUNSanctions(query: string): Observable<any> {
    return this.http.get(this.endpoints.un_sanctions, { responseType: 'text' }).pipe(
      map(xmlString => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const q = query.toLowerCase().trim();
        
        // Simple search in all FIRST_NAME and SECOND_NAME tags
        const names = Array.from(xmlDoc.getElementsByTagName('FIRST_NAME'))
          .concat(Array.from(xmlDoc.getElementsByTagName('SECOND_NAME')))
          .concat(Array.from(xmlDoc.getElementsByTagName('DATAID')));
        
        const matches = names.filter(n => n.textContent?.toLowerCase().includes(q));
        
        return {
          found: matches.length > 0,
          matches: matches.slice(0, 5).map(m => m.textContent)
        };
      }),
      catchError(() => of({ found: false, matches: [] }))
    );
  }

  searchOpenCorporates(query: string): Observable<OpenCorporatesResponse> {
    const params = new HttpParams().set('q', query).set('per_page', '5');
    return this.http.get<OpenCorporatesResponse>(`${this.endpoints.opencorporates}/companies/search`, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ results: { total_count: 0, companies: [] } }))
    );
  }

  searchOfficers(query: string): Observable<any> {
    // Search for people who are officers in companies
    const params = new HttpParams().set('q', query).set('per_page', '5');
    return this.http.get<any>(`${this.endpoints.opencorporates}/officers/search`, { params }).pipe(
      timeout(environment.apiTimeout),
      catchError(() => of({ results: { total_count: 0, officers: [] } }))
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
}
