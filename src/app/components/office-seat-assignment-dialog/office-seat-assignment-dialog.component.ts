import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FloorService } from '../../services/floor.service';
import { EmployeeService } from '../../services/employee.service';
import { MatButtonModule } from '@angular/material/button';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { Floor } from '../../interfaces/floor.interface';
import { Seat } from '../../interfaces/seat.interface';
import { Signal, effect } from '@angular/core';

export interface OfficeSeatDialogData {
  employeeId: number;
  employeeName: string;
}

@Component({
  selector: 'app-office-seat-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule
  ],
  templateUrl: './office-seat-assignment-dialog.component.html',
  styleUrls: ['./office-seat-assignment-dialog.component.scss']
})
export class OfficeSeatAssignmentDialogComponent implements OnInit {
  loading = false;
  error: string | null = null;
  selectedFloorControl = new FormControl<number | null>(null);
  floors: Signal<Floor[]>;
  selectedFloor: Signal<Floor | null>;
  seatUpdate: Signal<{ seatId: number, seat: Partial<Seat> } | null>;

  constructor(
    private floorService: FloorService,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OfficeSeatAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OfficeSeatDialogData
  ) {
    this.floors = this.floorService.floors;
    this.selectedFloor = this.floorService.selectedFloor;
    this.seatUpdate = this.floorService.seatUpdate;
    
    // Set up an effect to handle seat updates
    effect(() => {
      const update = this.seatUpdate();
      // When a seat update occurs, we can do specific handling here if needed
      if (update) {
        console.log('Seat update detected:', update);
        // The UI will automatically update because we're using signals
      }
    });
  }

  ngOnInit() {
    // Handle floor selection changes
    this.selectedFloorControl.valueChanges.subscribe(floorNumber => {
      if (floorNumber !== null) {
        this.loading = true;
        this.error = null;
        this.floorService.loadFloor(floorNumber);
        this.loading = false;
      }
    });

    // Set initial floor selection
    const currentFloors = this.floors();
    if (currentFloors.length > 0 && this.selectedFloorControl.value === null) {
      this.selectedFloorControl.setValue(currentFloors[0].floorNumber);
    }
  }

  // TrackBy function to improve rendering performance
  trackBySeatId(index: number, seat: any): number {
    return seat.id;
  }

  isSeatOccupied(seat: any): boolean {
    return seat.employees && seat.employees.length > 0;
  }

  onSeatClick(seatId: number) {
    this.assignSeatToEmployee(this.data.employeeId, seatId);
  }

  private assignSeatToEmployee(employeeId: number, seatId: number) {
    this.loading = true;
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
                id: this.data.employeeId,
                fullName: this.data.employeeName,
                occupation: ''
              }
            ]
          });
          
          this.loading = false;
          this.dialogRef.close(true);
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
          this.loading = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
} 