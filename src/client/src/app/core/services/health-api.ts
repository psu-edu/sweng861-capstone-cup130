import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  database: 'connected' | 'unavailable';
}

@Injectable({
  providedIn: 'root',
})
export class HealthApi {
  private readonly http = inject(HttpClient);

  getHealth() {
    return this.http.get<HealthResponse>('/health');
  }
}