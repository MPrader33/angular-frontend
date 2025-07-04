import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Floor } from '../interfaces/floor.interface';
import { catchError, retry, throwError, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { Seat } from '../interfaces/seat.interface';

/**
 * Service responsible for managing floor data and seat occupancy state.
 * Uses Angular's signals for reactive state management and HttpClient for API communication.
 */
@Injectable({
  providedIn: 'root'
})
export class FloorService {
  /** Base URL for the API endpoints */
  private apiUrl = 'http://localhost:8080/api';

  /** Signal holding the currently selected floor's data */
  private selectedFloorSignal = signal<Floor | null>(null);

  /** Signal holding the list of all available floors */
  private floorsSignal = signal<Floor[]>([]);
  
  /** Signal for seat updates - to allow updating individual seats without refreshing the entire floor */
  private seatUpdateSignal = signal<{ seatId: number, seat: Partial<Seat> } | null>(null);

  constructor(private http: HttpClient) {
    // Load the list of floors when the service is initialized
    this.loadFloors();
  }

  /**
   * Returns a readonly signal of the currently selected floor
   * @returns A readonly signal containing the current floor data or null if no floor is selected
   */
  get selectedFloor() {
    return this.selectedFloorSignal.asReadonly();
  }

  /**
   * Returns a readonly signal of all available floors
   * @returns A readonly signal containing the array of all floors
   */
  get floors() {
    return this.floorsSignal.asReadonly();
  }
  
  /**
   * Returns a readonly signal for seat updates
   * @returns A readonly signal containing the latest seat update
   */
  get seatUpdate() {
    return this.seatUpdateSignal.asReadonly();
  }

  /**
   * Handles HTTP errors and provides consistent error reporting
   * @param error The HTTP error response
   * @returns An observable that emits the error message
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
   * Fetches the list of all available floors from the API
   * Updates the floorsSignal with the retrieved data
   */
  private loadFloors() {
    this.http.get<Floor[]>(`${this.apiUrl}/floors`, {
      headers: {
        'Accept': 'application/json'
      },
      withCredentials: true
    })
    .pipe(
      retry(1),
      catchError(this.handleError)
    )
    .subscribe({
      next: (floors) => {
        console.log('Received floors data:', floors);
        this.floorsSignal.set(floors);
      },
      error: (error) => {
        console.error('Error loading floors:', error);
        this.floorsSignal.set([]);
      }
    });
  }

  /**
   * Loads detailed information for a specific floor
   * @param floorNumber The number of the floor to load
   * Updates the selectedFloorSignal with the retrieved floor data
   */
  loadFloor(floorNumber: number) {
    this.http.get<Floor>(`${this.apiUrl}/floors/${floorNumber}`, {
      headers: {
        'Accept': 'application/json'
      },
      withCredentials: true
    })
    .pipe(
      retry(1),
      catchError(this.handleError)
    )
    .subscribe({
      next: (floor) => {
        console.log('Received floor data:', floor);
        // Sort rooms by roomNumber before setting the floor data
        const sortedFloor = {
          ...floor,
          rooms: floor.rooms ? [...floor.rooms].sort((a, b) => {
            // Convert room numbers to numbers for proper numeric sorting
            const aNum = parseInt(a.roomNumber);
            const bNum = parseInt(b.roomNumber);
            return aNum - bNum;
          }) : []
        };
        this.selectedFloorSignal.set(sortedFloor);
      },
      error: (error) => {
        console.error('Error loading floor:', error);
        this.selectedFloorSignal.set(null);
      }
    });
  }

  /**
   * Toggles the occupancy status of a specific seat
   * @param roomId The ID of the room containing the seat
   * @param seatId The ID of the seat to toggle
   * Updates the selectedFloorSignal with the modified seat state
   */
  toggleSeatOccupancy(roomId: number, seatId: number) {
    // This is a local UI update only, not making an API call
    const currentFloor = this.selectedFloorSignal();
    
    if (currentFloor && currentFloor.rooms) {
      const updatedRooms = currentFloor.rooms.map(room => {
        if (room.id === roomId && room.seats) {
          const updatedSeats = room.seats.map(seat => {
            if (seat.id === seatId) {
              // Check if the seat has employees
              const hasEmployees = seat.employees && seat.employees.length > 0;
              // Toggle the occupied state based on whether there are employees
              return { ...seat, occupied: !hasEmployees };
            }
            return seat;
          });
          
          return { ...room, seats: updatedSeats };
        }
        return room;
      });
      
      this.selectedFloorSignal.set({ ...currentFloor, rooms: updatedRooms });
    }
  }

  getSeatInfo(seatId: number): Observable<Seat> {
    return this.http.get<Seat>(`${this.apiUrl}/seats/${seatId}`).pipe(
      retry(1),
      catchError((error) => {
        console.error('Error fetching seat info:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates a single seat in the current floor
   * @param seatId The ID of the seat to update
   * @param properties The updated seat data
   * @returns True if the seat was found and updated, false otherwise
   */
  updateSeat(seatId: number, properties: Partial<Seat>): boolean {
    const currentFloor = this.selectedFloorSignal();
    
    if (!currentFloor || !currentFloor.rooms) {
      return false;
    }
    
    let seatFound = false;
    
    const updatedRooms = currentFloor.rooms.map(room => {
      if (!room.seats) {
        return room;
      }
      
      const updatedSeats = room.seats.map(seat => {
        if (seat.id === seatId) {
          seatFound = true;
          return { ...seat, ...properties };
        }
        return seat;
      });
      
      return { ...room, seats: updatedSeats };
    });
    
    if (seatFound) {
      // Update the overall floor state
      this.selectedFloorSignal.set({ ...currentFloor, rooms: updatedRooms });
      
      // Also emit a seat-specific update via the seatUpdateSignal
      this.seatUpdateSignal.set({ seatId, seat: properties });
      
      return true;
    }
    
    return false;
  }

  addSeat(seat: Omit<Seat, 'id' | 'seatNumber' | 'createdAt'>): Observable<Seat> {
    return this.http.post<Seat>(`${this.apiUrl}/seats`, seat).pipe(
      retry(1),
      tap(newSeat => this.addSeatToSignal(newSeat)),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error adding new seat:`, error);
        return throwError(() => new Error(`Failed to add seat. Status: ${error.status}`));
      })
    );
  }

  private addSeatToSignal(newSeat: Seat) {
    const floor = this.selectedFloorSignal();
    if (!floor || !floor.rooms || !newSeat.room) return;

    const updatedRooms = floor.rooms.map(room => {
      if (room.id === newSeat.room!.id) {
        return {
          ...room,
          seats: [ ...(room.seats ?? []), newSeat ]
        };
      }
      return room;
    });

    this.selectedFloorSignal.set({ ...floor, rooms: updatedRooms });
  }

  deleteSeat(seatId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/seats/${seatId}`).pipe(
      retry(1),
      tap(() => this.removeSeatFromSignal(seatId)),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error deleting seat with ID ${seatId}:`, error);
        return throwError(() => new Error(`Failed to delete seat. Status: ${error.status}`));
      })
    );
  }

  private removeSeatFromSignal(seatId: number) {
    const floor = this.selectedFloorSignal();
    if (!floor || !floor.rooms) return;

    const updatedRooms = floor.rooms.map(room => ({
      ...room,
      seats: room.seats?.filter(seat => seat.id !== seatId) ?? []
    }));

    this.selectedFloorSignal.set({ ...floor, rooms: updatedRooms });
  }
}
