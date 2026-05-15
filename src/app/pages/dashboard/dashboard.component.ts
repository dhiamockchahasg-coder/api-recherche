import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs/operators';
import { interval, Subscription, forkJoin } from 'rxjs';
import { ComplianceService } from '../../core/services/compliance.service';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="dashboard-container">
  <header class="main-header">
    <div class="brand">
      <span class="logo">🛡️</span>
      <h1>Compliance Portal</h1>
    </div>
    <div class="search-box">
      <div class="input-group">
        <input type="text" [(ngModel)]="searchQuery" 
               placeholder="Search person or company..." 
               (keyup.enter)="performUnifiedSearch()">
        <button class="btn-search" (click)="performUnifiedSearch()" [disabled]="loading || !searchQuery">
          {{ loading ? 'Analyzing...' : 'Search' }}
        </button>
      </div>
    </div>
  </header>

  <div class="risk-overview" *ngIf="status === 'success'">
    <div class="risk-score-card" [class.high]="overallRiskScore > 50" [class.low]="overallRiskScore <= 50">
      <div class="score-value">{{ overallRiskScore }}</div>
      <div class="score-label">Risk Score</div>
    </div>
    <div class="risk-details">
      <h2>{{ dangerLevel }} Threat Level</h2>
      <p>Aggregated from international intelligence sources.</p>
      <ul class="risk-factors" *ngIf="riskFactors.length > 0">
        <li *ngFor="let factor of riskFactors">{{ factor }}</li>
      </ul>
      <div class="alert-badges">
        <span *ngIf="unifiedResults.wikidata_pep?.results?.bindings?.length > 0" class="badge pep">🏛️ PEP DETECTED</span>
      </div>
    </div>
  </div>

  <nav class="sub-nav">
    <button *ngFor="let cat of categories" 
            [class.active]="activeCategory === cat.id"
            (click)="activeCategory = cat.id">
      {{ cat.label }}
    </button>
  </nav>

  <main class="results-container">
    <div class="results-grid" *ngIf="status === 'success'">
      <div class="card" *ngIf="shouldShowCard('global_sanctions')">
        <div class="card-header">
          <h3>Official Sanctions</h3>
          <span class="status-badge" [class.danger]="unifiedResults.global_sanctions?.found">
            {{ unifiedResults.global_sanctions?.found ? 'HIT FOUND' : 'CLEAN' }}
          </span>
        </div>
        <div class="card-content">
          <div *ngIf="unifiedResults.global_sanctions?.found" class="alert-box">
            <p>Listed on: {{ unifiedResults.global_sanctions.sources?.join(', ') }}</p>
          </div>
          <div *ngIf="!unifiedResults.global_sanctions?.found" class="success-box">
            No active sanctions found in World Bank or Interpol databases.
          </div>
        </div>
      </div>

      <div class="card" *ngIf="shouldShowCard('fbi')">
        <div class="card-header">
          <h3>FBI Wanted List</h3>
          <span class="status-badge" [class.danger]="unifiedResults.fbi?.total > 0">
            {{ unifiedResults.fbi?.total > 0 ? 'WANTED' : 'NOT FOUND' }}
          </span>
        </div>
        <div class="card-content">
          <div class="wanted-item" *ngFor="let item of unifiedResults.fbi?.items">
            <strong>{{ item.title }}</strong>
            <p style="font-size: 0.8rem; color: #ef4444;">{{ item.caution || 'See official FBI notice' | slice:0:100 }}...</p>
            <a [href]="item.url" target="_blank" style="font-size: 0.75rem; color: #6366f1;">View FBI Profile</a>
          </div>
          <div *ngIf="unifiedResults.fbi?.total === 0" class="empty-msg">No FBI records found.</div>
        </div>
      </div>

      <div class="card" *ngIf="shouldShowCard('aleph')">
        <div class="card-header">
          <h3>OCCRP Aleph Records</h3>
        </div>
        <div class="card-content">
          <div class="aleph-item" *ngFor="let res of unifiedResults.aleph?.results">
            <strong>{{ res.name }}</strong>
            <p style="font-size: 0.8rem; color: #64748b;">{{ res.schema }} • {{ res.collection?.label }}</p>
          </div>
          <div *ngIf="unifiedResults.aleph?.total === 0" class="empty-msg">No investigative records found.</div>
        </div>
      </div>

      <div class="card" *ngIf="shouldShowCard('littlesis')">
        <div class="card-header">
          <h3>Corporate Network</h3>
        </div>
        <div class="card-content">
          <div class="officer-item" *ngFor="let ent of unifiedResults.littlesis?.data">
            <div class="name">{{ ent.attributes?.name }}</div>
            <div class="role">{{ ent.attributes?.primary_ext }}</div>
            <p class="blurb" style="font-size: 0.8rem; color: #64748b;">{{ ent.attributes?.blurb }}</p>
          </div>
          <div *ngIf="unifiedResults.littlesis?.data?.length === 0" class="empty-msg">No network data found.</div>
        </div>
      </div>

      <div class="card" *ngIf="shouldShowCard('interpol')">
        <div class="card-header">
          <h3>Interpol Red Notices</h3>
        </div>
        <div class="card-content">
          <div class="wanted-stat">{{ unifiedResults.interpol?.total || 0 }} Notices Found</div>
          <div class="notice" *ngFor="let notice of unifiedResults.interpol?._embedded?.notices">
            <strong>{{ notice.name }}</strong>, {{ notice.forename }}
          </div>
        </div>
      </div>

      <div class="card" *ngIf="shouldShowCard('etalab')">
        <div class="card-header">
          <h3>French Registry (Etalab)</h3>
        </div>
        <div class="card-content">
          <div class="company-item" *ngFor="let comp of unifiedResults.etalab?.results">
            <div class="name">{{ comp.nom_complet }}</div>
            <div class="siren">SIREN: {{ comp.siren }}</div>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="shouldShowCard('wikidata')">
        <div class="card-header">
          <h3>Wikidata Entities</h3>
        </div>
        <div class="card-content">
          <div class="wikidata-item" *ngFor="let item of unifiedResults.wikidata?.search">
            <strong>{{ item.label }}</strong>
            <p style="font-size: 0.8rem; color: #64748b;">{{ item.description }}</p>
          </div>
          <div *ngIf="unifiedResults.wikidata_pep?.results?.bindings?.length > 0" class="pep-box">
            <h4>Politically Exposed Person (PEP) Details</h4>
            <div class="pep-item" *ngFor="let b of unifiedResults.wikidata_pep.results.bindings">
              <strong>{{ b.personLabel.value }}</strong>
              <p style="font-size: 0.75rem; color: #6366f1;">{{ b.positionLabel?.value }}</p>
            </div>
          </div>
          <div *ngIf="unifiedResults.wikidata?.search?.length === 0" class="empty-msg">No Wikidata records found.</div>
        </div>
      </div>

      <div class="card" *ngIf="shouldShowCard('worldbank')">
        <div class="card-header">
          <h3>World Bank Documents</h3>
          <span class="status-badge" [class.danger]="unifiedResults.worldbank?.total > 0">
            {{ unifiedResults.worldbank?.total > 0 ? 'LISTED' : 'CLEAN' }}
          </span>
        </div>
        <div class="card-content">
          <div class="wb-item" *ngFor="let doc of unifiedResults.worldbank?.documents | keyvalue">
            <strong>{{ doc.value.display_title }}</strong>
            <p style="font-size: 0.8rem; color: #ef4444;">{{ doc.value.docdt | slice:0:10 }}</p>
          </div>
          <div *ngIf="unifiedResults.worldbank?.total === 0" class="empty-msg">No World Bank records found.</div>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="loading">
      <div class="spinner"></div>
      <p>Scanning global investigative databases...</p>
    </div>

    <div class="empty-state" *ngIf="status === 'idle'">
      <h2>Global Intelligence Check</h2>
      <p>Search across FBI, Interpol, World Bank, OCCRP, and national registries instantly.</p>
    </div>
  </main>
</div>
  `,
  styles: `
:host {
  --primary: #6366f1;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --text-dark: #0f172a;
  --text-muted: #64748b;
  --border: #e2e8f0;
  display: block;
  min-height: 100vh;
  background-color: var(--bg);
  color: var(--text-dark);
  font-family: 'Inter', -apple-system, sans-serif;
}
.dashboard-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; flex-wrap: wrap; gap: 2rem; }
.brand { display: flex; align-items: center; gap: 1rem; }
.brand .logo { font-size: 2rem; }
.brand h1 { font-size: 1.5rem; font-weight: 800; margin: 0; }
.search-box { flex: 1; max-width: 600px; }
.input-group { display: flex; background: white; border: 1px solid var(--border); border-radius: 12px; padding: 4px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.input-group input { flex: 1; border: none; padding: 0.75rem 1rem; font-size: 1rem; outline: none; background: transparent; }
.btn-search { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn-search:disabled { opacity: 0.6; }
.risk-overview { display: flex; align-items: center; gap: 2rem; background: white; padding: 1.5rem 2rem; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 2rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05); }
.risk-score-card { width: 80px; height: 80px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; }
.risk-score-card.low { background: var(--success); }
.risk-score-card.high { background: var(--danger); }
.score-value { font-size: 1.5rem; font-weight: 800; }
.score-label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.8; }
.risk-details h2 { margin: 0 0 0.25rem 0; font-size: 1.25rem; }
.risk-details p { margin: 0; color: var(--text-muted); font-size: 0.9rem; }
.sub-nav { display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
.sub-nav button { background: transparent; border: none; padding: 0.5rem 1rem; color: var(--text-muted); font-weight: 600; cursor: pointer; border-radius: 6px; }
.sub-nav button.active { color: var(--primary); background: #eff6ff; }
.results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
.card { background: white; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
.card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-dark); }
.card-content { padding: 1.5rem; flex: 1; }
.status-badge { padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.75rem; font-weight: 700; background: #f1f5f9; }
.status-badge.danger { background: #fee2e2; color: #ef4444; }
.officer-item, .company-item { padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
.alert-box { background: #fff1f2; border: 1px solid #fecdd3; padding: 1rem; border-radius: 8px; color: #be123c; font-weight: 600; font-size: 0.9rem; }
.success-box { background: #f0fdf4; border: 1px solid #dcfce7; padding: 1rem; border-radius: 8px; color: #15803d; font-size: 0.9rem; }
.loading-state, .empty-state { text-align: center; padding: 5rem 0; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.risk-factors { list-style: none; padding: 0; margin: 0.5rem 0; }
.risk-factors li { font-size: 0.85rem; color: var(--text-dark); padding: 0.25rem 0; display: flex; align-items: center; gap: 0.5rem; }
.risk-factors li::before { content: "•"; color: var(--danger); font-weight: bold; }
.alert-badges { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.badge { padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; }
.badge.pep { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }
.pep-box { margin-top: 1.5rem; padding-top: 1rem; border-top: 2px dashed var(--border); }
.pep-box h4 { margin: 0 0 0.75rem 0; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; }
.pep-item { background: var(--bg); padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; }
.pep-item strong { display: block; font-size: 0.9rem; }
.empty-msg { color: var(--text-muted); font-size: 0.9rem; font-style: italic; }
  `
})
export class DashboardComponent implements OnDestroy {
  private compliance = inject(ComplianceService);

  searchQuery = '';
  status: TestStatus = 'idle';
  error: string | null = null;
  activeCategory = 'unified';
  lastApi = '';
  elapsedTime = 0;
  showRaw = false;
  
  unifiedResults: any = {};
  overallRiskScore = 0;
  dangerLevel = 'Minimal';
  dangerColor = '🟢';
  dangerBar = '░░░░░░░░░░';
  riskFactors: string[] = [];

  categories = [
    { id: 'unified', label: 'Vue Unifiée' },
    { id: 'sanctions', label: 'Sanctions & PEP' },
    { id: 'entities', label: 'Entreprises & Dirigeants' },
    { id: 'world', label: 'Global & Wikidata' }
  ];

  private timerSub?: Subscription;

  get loading() { return this.status === 'loading'; }

  ngOnDestroy() {
    this.stopTimer();
  }

  performUnifiedSearch() {
    if (!this.searchQuery) return;
    
    this.reset();
    this.status = 'loading';
    this.startTimer();
    this.lastApi = 'Analyse Globale';

    const requests = {
      littlesis: this.compliance.searchLittleSis(this.searchQuery),
      etalab: this.compliance.searchEtalab(this.searchQuery),
      interpol: this.compliance.searchInterpol(this.searchQuery),
      worldbank: this.compliance.searchWorldBank(this.searchQuery),
      global_sanctions: this.compliance.searchGlobalSanctions(this.searchQuery),
      wikidata: this.compliance.searchWikidata(this.searchQuery),
      wikidata_pep: this.compliance.searchWikidataPEP(this.searchQuery),
      fbi: this.compliance.searchFBI(this.searchQuery),
      aleph: this.compliance.searchAleph(this.searchQuery)
    };

    forkJoin(requests).pipe(
      finalize(() => {
        this.calculateRisk();
        this.status = 'success';
        this.stopTimer();
      })
    ).subscribe(results => {
      console.log('Search Results:', results);
      this.unifiedResults = results;
      
      // DEEP DIVE: If LittleSis found entities, check their relationships
      if (results.littlesis?.data?.length > 0) {
        const topEntity = results.littlesis.data[0];
        this.compliance.searchAssociates(String(topEntity.id)).subscribe(rels => {
          this.unifiedResults.relationships = rels.data || [];
          this.calculateRisk();
        });
      }
    });
  }

  private calculateRisk() {
    let score = 0;
    const r = this.unifiedResults;
    const factors: string[] = [];

    // CRITICAL: Official Sanctions
    if (r.global_sanctions?.found) {
      score = Math.max(score, 100);
      factors.push('Direct match in Global Sanctions lists (World Bank/Interpol)');
    }

    // HIGH: Interpol & FBI
    if (r.interpol?.total > 0) {
      score = Math.max(score, 100);
      factors.push('Active Interpol Red Notice detected');
    }
    if (r.fbi?.total > 0) {
      score = Math.max(score, 95);
      factors.push('Subject found on FBI Wanted list');
    }


    // MEDIUM-HIGH: PEP Status
    if (r.wikidata_pep?.results?.bindings?.length > 0) {
      score = Math.max(score, 75);
      factors.push('Politically Exposed Person (PEP) identified');
    }

    // MEDIUM: World Bank Debarred
    if (r.worldbank?.total > 0) {
      score = Math.max(score, 80);
      factors.push('Found in World Bank Debarred list');
    }

    // MEDIUM: Investigative Records (Aleph, LittleSis)
    if (r.aleph?.total > 0) {
      score = Math.max(score, 50);
      factors.push('Mentioned in investigative reporting (Aleph/OCCRP)');
    }
    if (r.littlesis?.data?.length > 0) {
      score = Math.max(score, 40);
      factors.push('Subject of corporate influence tracking (LittleSis)');
    }

    // LOW: Corporate Registries
    if (r.etalab?.total_results > 0) score = Math.max(score, 20);

    // ESCALATION: Indirect Links
    if (r.relationships?.length > 0) {
      const suspicious = r.relationships.some((rel: any) => 
        /sanction|criminal|illegal|court|lawsuit|money|laundry/i.test(rel.attributes?.description || '')
      );
      if (suspicious) {
        score = Math.min(100, score + 20);
        factors.push('Suspicious corporate relationships detected');
      }
    }

    this.overallRiskScore = score;
    this.riskFactors = [...new Set(factors)];
    
    if (score > 80) { this.dangerLevel = 'CRITICAL'; this.dangerColor = '🔴'; }
    else if (score > 50) { this.dangerLevel = 'Elevated'; this.dangerColor = '🟠'; }
    else if (score > 20) { this.dangerLevel = 'Low'; this.dangerColor = '🟡'; }
    else { this.dangerLevel = 'Minimal'; this.dangerColor = '🟢'; }

    const barLength = Math.round(score / 10);
    this.dangerBar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
  }

  reset() {
    this.status = 'idle';
    this.unifiedResults = {};
    this.overallRiskScore = 0;
    this.riskFactors = [];
    this.dangerLevel = 'Minimal';
    this.dangerBar = '░░░░░░░░░░';
    this.error = null;
    this.stopTimer();
  }

  private startTimer() {
    this.stopTimer();
    this.timerSub = interval(100).subscribe(() => this.elapsedTime += 0.1);
  }

  private stopTimer() {
    this.timerSub?.unsubscribe();
  }

  shouldShowCard(type: string): boolean {
    if (this.activeCategory === 'unified') return true;
    if (this.activeCategory === 'sanctions') {
      return ['littlesis', 'interpol', 'global_sanctions', 'fbi', 'aleph'].includes(type);
    }
    if (this.activeCategory === 'entities') {
      return ['etalab', 'worldbank', 'littlesis'].includes(type);
    }
    if (this.activeCategory === 'world') {
      return ['wikidata', 'worldbank'].includes(type);
    }
    return false;
  }
}
