import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiOrchestratorService, ServiceMode } from '../../services/api-orchestrator.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-api-status',
  templateUrl: './api-status.component.html',
  styleUrls: ['./api-status.component.scss']
})
export class ApiStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  serviceStatus: any = {};
  isVisible = false;
  availableModes: ServiceMode[] = ['auto', 'api', 'mock'];

  constructor(
    private apiOrchestrator: ApiOrchestratorService
  ) {}

  ngOnInit(): void {
    // Only show in development mode
    this.isVisible = !environment.production && environment.features?.enableDebugMode;
    
    if (this.isVisible) {
      this.loadServiceStatus();
      this.subscribeToUpdates();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadServiceStatus(): void {
    this.apiOrchestrator.getServiceStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.serviceStatus = status;
      });
  }

  private subscribeToUpdates(): void {
    // Subscribe to health status changes
    this.apiOrchestrator.healthStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadServiceStatus();
      });

    // Subscribe to service mode changes
    this.apiOrchestrator.serviceMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadServiceStatus();
      });
  }

  onModeChange(mode: ServiceMode): void {
    this.apiOrchestrator.setServiceMode(mode);
  }

  onHealthCheck(): void {
    this.apiOrchestrator.checkApiHealth().subscribe();
  }

  getStatusColor(): string {
    if (!this.serviceStatus.health) return 'warn';
    return this.serviceStatus.health.isHealthy ? 'primary' : 'warn';
  }

  getStatusIcon(): string {
    if (!this.serviceStatus.health) return 'help';
    return this.serviceStatus.health.isHealthy ? 'check_circle' : 'error';
  }

  getServiceModeColor(mode: ServiceMode): string {
    if (this.serviceStatus.mode === mode) {
      return mode === 'api' ? 'primary' : mode === 'mock' ? 'accent' : 'warn';
    }
    return '';
  }
}
