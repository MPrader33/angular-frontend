import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardService } from '../../services/dashboard.service';
import { DetailedDashboardStats } from '../../interfaces/dashboard.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = signal<DetailedDashboardStats | null>(null);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
    console.log('DashboardComponent ngOnInit');
  }

  private loadStats(): void {
    this.dashboardService.getDashboardStats().subscribe(stats => {
      this.stats.set(stats);
    });
  }
} 