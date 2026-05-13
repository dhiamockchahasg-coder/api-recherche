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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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
      aleph: this.compliance.searchAleph(this.searchQuery),
      opencorporates: this.compliance.searchOpenCorporates(this.searchQuery),
      icij: this.compliance.searchICIJ(this.searchQuery)
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

      // RBE: If Etalab found companies, check beneficiaries for the first one
      if (results.etalab?.results?.length > 0) {
        const siren = results.etalab.results[0].siren;
        this.compliance.getBeneficiairesEffectifs(siren).subscribe(rbe => {
          this.unifiedResults.rbe = rbe;
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
      const gs = r.global_sanctions;
      const hasHighConfidence = gs.details?.opensanctions?.responses?.q1?.results?.some((res: any) => res.score > 0.8) ||
                               gs.details?.un?.found || gs.details?.eu?.found || gs.details?.french?.publications?.length > 0;
      
      if (hasHighConfidence) {
        score = Math.max(score, 100);
        factors.push('Direct match in Global Sanctions lists (UN/EU/OFAC/FR)');
      } else {
        score = Math.max(score, 60);
        factors.push('Potential fuzzy match in Sanctions databases');
      }
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

    // HIGH: Offshore Leaks
    if (r.icij?.q1?.result?.length > 0) {
      score = Math.max(score, 85);
      factors.push('Entity linked to Offshore Leaks (Panama/Pandora Papers)');
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
    if (r.opencorporates?.results?.total_count > 0) score = Math.max(score, 20);
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
