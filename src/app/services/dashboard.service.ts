import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, retry, shareReplay } from 'rxjs/operators';
import { DashboardStats, DetailedDashboardStats } from '../interfaces/dashboard.interface';

const API_BASE_URL = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${API_BASE_URL}/stats`;

  // Mock data - replace with actual API calls in production
  private mockStats: DetailedDashboardStats = {
    totalEmployees: 150,
    totalFloors: 4,
    totalOffices: 40,
    totalSeats: 200,
    occupancyRate: 75,
    occupiedSeats: 150
  };

  // Cached stats observable
  private stats$: Observable<DetailedDashboardStats> | null = null;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DetailedDashboardStats> {
    if (!this.stats$) {
      this.loadStatsFromServer();
    }

    return this.stats$!;
  }

  private loadStatsFromServer(): void {
    this.stats$ = this.http.get<DetailedDashboardStats>(this.apiUrl).pipe(
      retry(1),
      catchError((error) => {
        console.warn('Error fetching stats from server, using mock data:', error);
        return of(this.mockStats);
      }),
      // Cache the last emitted value and share it among all subscribers
      shareReplay(1)
    );
  }

  resetStats(): void {
    this.stats$ = null;
  }
} 