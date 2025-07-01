import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { EmployeeService } from '../../../services/employee.service';
import { Employee } from '../../../interfaces/employee.interface';
import { Seat } from '../../../interfaces/seat.interface';
import { Floor } from '../../../interfaces/floor.interface';
import { FloorService } from '../../../services/floor.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Signal, effect } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-employee-seats-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './employee-seats-dialog.component.html',
  styleUrls: ['./employee-seats-dialog.component.scss']
})
export class EmployeeSeatsDialogComponent {
  seats: Seat[] = [];
  loading = false;
  error: string | null = null;

  
  // For seat assignment
  isAssigningSeats = false;
  selectedFloorControl = new FormControl<number | null>(null);
  floors: Signal<Floor[]>;
  selectedFloor: Signal<Floor | null>;
  seatUpdate: Signal<{ seatId: number, seat: Partial<Seat> } | null>;
  assignmentLoading = false;

  constructor(
    private dialogRef: MatDialogRef<EmployeeSeatsDialogComponent>,
    private employeeService: EmployeeService,
    private router: Router,
    private floorService: FloorService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public employee: Employee
  ) {
    // Initialize floor service signals first
    this.floors = this.floorService.floors;
    this.selectedFloor = this.floorService.selectedFloor;
    this.seatUpdate = this.floorService.seatUpdate;
    
    // Set up an effect to handle seat updates (without console logging to reduce noise)
    effect(() => {
      const update = this.seatUpdate();
      // The UI will automatically update because we're using signals
    });
    
    // Set up an effect to handle floor loading completion
    effect(() => {
      const floor = this.selectedFloor();
      if (floor && this.assignmentLoading) {
        this.assignmentLoading = false;
      }
    });
    
    // Load data after a brief delay to prevent initial flicker
    setTimeout(() => {
      this.loadEmployeeSeats();
    }, 0);
  }

  private loadEmployeeSeats(silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
    }
    this.error = null;
    
    this.employeeService.getEmployeeSeats(this.employee.id)
      .subscribe({
        next: (seats) => {
          this.seats = seats;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  reserveSeat(): void {
    // Switch to seat assignment mode
    this.isAssigningSeats = true;
    
    // Initialize floor selection
    const currentFloors = this.floors();
    
    if (currentFloors.length > 0 && this.selectedFloorControl.value === null) {
      this.selectedFloorControl.setValue(currentFloors[0].floorNumber);
      // Manually trigger the floor loading since setValue might not trigger valueChanges immediately
      this.assignmentLoading = true;
      this.error = null;
      this.floorService.loadFloor(currentFloors[0].floorNumber);
    }
    
    // Handle floor selection changes
    this.selectedFloorControl.valueChanges.subscribe(floorNumber => {
      if (floorNumber !== null) {
        this.assignmentLoading = true;
        this.error = null;
        this.floorService.loadFloor(floorNumber);
        // Don't set assignmentLoading = false here, let the floor loading complete
        // The loading will be handled by the selectedFloor signal changes
      }
    });
  }
  
  // Track by functions to improve rendering performance
  trackBySeatId(index: number, seat: any): number {
    return seat.id;
  }

  isSeatOccupied(seat: any): boolean {
    return seat.employees && seat.employees.length > 0;
  }

  onSeatClick(seatId: number) {
    this.assignSeatToEmployee(this.employee.id, seatId);
  }

  private assignSeatToEmployee(employeeId: number, seatId: number) {
    this.assignmentLoading = true;
    console.log('Making API call to assign seat:', {
      employeeId: employeeId,
      seatId: seatId
    });
    
    this.employeeService.assignSeat(employeeId, seatId)
      .subscribe({
        next: () => {
          console.log('Seat assignment successful');
          
          // Directly update the seat using the FloorService
          this.floorService.updateSeat(seatId, {
            occupied: true,
            employees: [
              {
                id: this.employee.id,
                fullName: this.employee.fullName,
                occupation: ''
              }
            ]
          });
          
          this.assignmentLoading = false;
          this.snackBar.open('Seat assigned successfully', 'Close', { 
            duration: 3000,
            verticalPosition: 'top'
          });
          
          // Switch back to seats view and reload the list
          this.isAssigningSeats = false;
          this.loadEmployeeSeats(true);
        },
        error: (error) => {
          console.error('Seat assignment failed:', error);
          this.snackBar.open(
            `Failed to assign seat: ${error.message}`,
            'Close',
            { 
              duration: 5000,
              verticalPosition: 'top'
            }
          );
          this.assignmentLoading = false;
        }
      });
  }
  
  unassignSeat(seatId: number, event: Event): void {
    // Prevent event bubbling to parent elements
    event.stopPropagation();
    
    this.loading = true;
    this.error = null;
    
    this.employeeService.unassignSeat(this.employee.id, seatId)
      .subscribe({
        next: () => {
          console.log('Seat unassignment successful');
          
          this.snackBar.open('Seat unassigned successfully', 'Close', { 
            duration: 3000,
            verticalPosition: 'top'
          });
          
          // Reload the list to update
          this.loadEmployeeSeats(true);
        },
        error: (error) => {
          console.error('Seat unassignment failed:', error);
          this.error = error.message;
          this.loading = false;
          
          this.snackBar.open(
            `Failed to unassign seat: ${error.message}`,
            'Close',
            { 
              duration: 5000,
              verticalPosition: 'top'
            }
          );
        }
      });
  }
  
  cancelAssignment(): void {
    // Return to seat view - CSS will handle the size change
    this.isAssigningSeats = false;
  }
}
