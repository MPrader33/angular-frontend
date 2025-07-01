import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, retry, throwError, tap } from 'rxjs';
import { Floor } from '../interfaces/floor.interface';

@Injectable({
  providedIn: 'root'
})
export class FloorPlanService {
  /** Base URL for the API endpoints */
  private apiUrl = 'http://localhost:8080/api';
  
  /** Signal holding the currently loaded SVG content */
  private floorPlanSvgSignal = signal<string | null>(null);
  
  /** Signal for loading state */
  private loadingSignal = signal<boolean>(false);
  
  /** Signal for error state */
  private errorSignal = signal<string | null>(null);

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Returns a readonly signal of the currently loaded SVG
   */
  get floorPlanSvg() {
    return this.floorPlanSvgSignal.asReadonly();
  }
  
  /**
   * Returns a readonly signal of the loading state
   */
  get loading() {
    return this.loadingSignal.asReadonly();
  }
  
  /**
   * Returns a readonly signal of the error state
   */
  get error() {
    return this.errorSignal.asReadonly();
  }

  /**
   * Handles HTTP errors and provides consistent error reporting
   */
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    if (error.status === 0) {
      // Client-side or network error occurred
      console.error('Client-side error:', error.error);
    } else {
      // Backend returned an unsuccessful response code
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
    }
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }

  /**
   * Loads the SVG floor plan for a specific floor
   * @param floorNumber The floor number
   */
  loadFloorPlan(floorNumber: number) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    // Log clear start of request
    console.log(`🚀 REQUESTING SVG: ${this.apiUrl}/floors/${floorNumber}/svg`);
    
    // Use the dedicated SVG endpoint
    this.http.get(`${this.apiUrl}/floors/${floorNumber}/svg`, {
      responseType: 'text',
      headers: {
        'Accept': 'image/svg+xml'
      },
      withCredentials: true,
      observe: 'response'  // Get the full response to check headers
    })
    .pipe(
      tap(response => {
        // Log the response headers and status
        console.log('💡 Response status:', response.status);
        console.log('💡 Response headers:', response.headers.keys().map(key => `${key}: ${response.headers.get(key)}`));
        console.log('💡 Content type:', response.headers.get('content-type'));
      }),
      retry(1),
      catchError(error => {
        console.error('❌ Error fetching SVG:', error);
        this.errorSignal.set('Failed to load floor plan');
        this.loadingSignal.set(false);
        return this.handleError(error);
      })
    )
    .subscribe({
      next: (response) => {
        const svgContent = response.body as string;
        
        // Log the first part of the SVG content
        if (svgContent) {
          console.log('✅ Received SVG content:');
          console.log('```');
          console.log(svgContent.substring(0, 300) + (svgContent.length > 300 ? '...' : ''));
          console.log('```');
        } else {
          console.error('❌ Received empty SVG content');
        }
        
        if (!svgContent || svgContent.trim() === '') {
          this.errorSignal.set('Received empty SVG content from server');
          this.floorPlanSvgSignal.set(null);
        } else {
          console.log(`✅ SVG content length: ${svgContent.length} characters`);
          this.floorPlanSvgSignal.set(svgContent);
        }
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('❌ Error in SVG subscription:', err);
        this.floorPlanSvgSignal.set(null);
        this.loadingSignal.set(false);
      }
    });
  }
} 