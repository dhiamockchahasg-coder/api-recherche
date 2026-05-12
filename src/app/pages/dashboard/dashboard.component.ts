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
      eu_sanctions: this.compliance.searchEU_Sanctions(this.searchQuery),
      wikidata: this.compliance.searchWikidata(this.searchQuery)
    };

    forkJoin(requests).pipe(
      finalize(() => {
        this.calculateRisk();
        this.status = 'success';
        this.stopTimer();
      })
    ).subscribe(results => {
      this.unifiedResults = results;
    });
  }

  private calculateRisk() {
    let maxRisk = 0;
    const r = this.unifiedResults;

    if (r.eu_sanctions?.found) maxRisk = Math.max(maxRisk, 100);
    if (r.interpol?.total > 0) maxRisk = Math.max(maxRisk, 100);
    if (r.worldbank?.total > 0) maxRisk = Math.max(maxRisk, 80);
    if (r.littlesis?.data?.length > 0) maxRisk = Math.max(maxRisk, 40);
    if (r.wikidata?.search?.length > 0) maxRisk = Math.max(maxRisk, 30);
    if (r.etalab?.total_results > 0) maxRisk = Math.max(maxRisk, 20);

    this.overallRiskScore = maxRisk;
    
    if (maxRisk > 80) { this.dangerLevel = 'CRITICAL'; this.dangerColor = '🔴'; }
    else if (maxRisk > 50) { this.dangerLevel = 'Elevated'; this.dangerColor = '🟠'; }
    else if (maxRisk > 20) { this.dangerLevel = 'Low'; this.dangerColor = '🟡'; }
    else { this.dangerLevel = 'Minimal'; this.dangerColor = '🟢'; }

    const barLength = Math.round(maxRisk / 10);
    this.dangerBar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
  }

  reset() {
    this.status = 'idle';
    this.unifiedResults = {};
    this.overallRiskScore = 0;
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
      return ['littlesis', 'interpol', 'eu_sanctions'].includes(type);
    }
    if (this.activeCategory === 'entities') {
      return ['etalab', 'worldbank'].includes(type);
    }
    if (this.activeCategory === 'world') {
      return ['wikidata', 'worldbank'].includes(type);
    }
    return false;
  }
}
