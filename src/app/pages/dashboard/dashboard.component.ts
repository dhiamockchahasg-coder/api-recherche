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

  categories = [
    { id: 'unified', label: 'Vue Unifiée' },
    { id: 'sanctions', label: 'Sanctions & PEP' },
    { id: 'entities', label: 'Entreprises & Dirigeants' }
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
      csl: this.compliance.searchCSL(this.searchQuery),
      opencorporates: this.compliance.searchOpenCorporates(this.searchQuery)
    };

    forkJoin(requests).pipe(
      finalize(() => {
        this.status = 'success';
        this.stopTimer();
      })
    ).subscribe(results => {
      this.unifiedResults = results;
    });
  }

  reset() {
    this.status = 'idle';
    this.unifiedResults = {};
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
      return ['littlesis', 'interpol', 'csl'].includes(type);
    }
    if (this.activeCategory === 'entities') {
      return ['etalab', 'worldbank', 'opencorporates'].includes(type);
    }
    return false;
  }
}
