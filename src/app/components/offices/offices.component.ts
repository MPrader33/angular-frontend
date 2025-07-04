import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FloorService } from '../../services/floor.service';
import { EmployeeService } from '../../services/employee.service';
import { MatButtonModule } from '@angular/material/button';
import { jsPDF } from 'jspdf';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UnassignSeatDialogComponent } from '../unassign-seat-dialog/unassign-seat-dialog.component';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Floor } from '../../interfaces/floor.interface';
import { Room } from '../../interfaces/room.interface';
import { Seat } from '../../interfaces/seat.interface';
import { Signal } from '@angular/core';
import { DeleteSeatDialogComponent } from '../delete-seat-dialog/delete-seat-dialog.component';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

const MAX_SEATS_NUMBER = 4;

@Component({
  selector: 'app-offices',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './offices.component.html',
  styleUrls: ['./offices.component.scss']
})
export class OfficesComponent implements OnInit {
  loadingFloor = false;
  error: string | null = null;
  selectedFloorControl = new FormControl<number | null>(null);
  floors: Signal<Floor[]>;
  selectedFloor: Signal<Floor | null>;
  deletingSeatId: number | null = null;
  addingSeatRoomId: number | null = null;

  constructor(
    private floorService: FloorService,
    private dialog: MatDialog,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private employeeService: EmployeeService,
    private dashboardService: DashboardService
  ) {
    this.floors = this.floorService.floors;
    this.selectedFloor = this.floorService.selectedFloor;
  }

  isRoomEmpty(room: Room): boolean {
    return !room.seats?.some(seat => seat.employees && seat.employees.length > 0);
  }

  isSeatLimitReached(room: Room): boolean {
    const count = room.seats?.length ?? 0;
    return count >= MAX_SEATS_NUMBER;
  }

  onEmployeeClick(event: Event, employeeId: number, employeeName: string, seatId: number): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(UnassignSeatDialogComponent, {
      width: '400px',
      data: { employeeId, employeeName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.unassignSeat(employeeId, seatId);
      }
    });
  }

  private unassignSeat(employeeId: number, seatId: number): void {
    this.employeeService.unassignSeat(employeeId, seatId)
      .subscribe({
        next: () => {
          // Refresh the floor data
          const currentFloor = this.selectedFloorControl.value;
          if (currentFloor !== null) {
            this.floorService.loadFloor(currentFloor);
          }
          this.dashboardService.resetStats();
          this.snackBar.open('Seat unassigned successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        },
        error: (error) => {
          console.error('Error unassigning seat:', error);
          this.snackBar.open('Failed to unassign seat', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  ngOnInit(): void {
    // Handle floor selection changes
    this.selectedFloorControl.valueChanges.subscribe(floorNumber => {
      if (floorNumber !== null) {
        this.loadingFloor = true;
        this.error = null;
        this.floorService.loadFloor(floorNumber);
        this.loadingFloor = false;
      }
    });

    // Set initial floor selection
    const currentFloors = this.floors();
    if (currentFloors.length > 0 && this.selectedFloorControl.value === null) {
      this.selectedFloorControl.setValue(currentFloors[0].floorNumber);
    }
  }

  printRoomLabel(room: Room): void {
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Add room header
    doc.setFontSize(20);
    doc.text(`${room.name} (Room ${room.roomNumber})`, pageWidth / 2, yPosition, { align: 'center' });
    
    // Add floor name
    yPosition += 10;
    doc.setFontSize(14);
    const floor = this.selectedFloor();
    if (floor) {
      doc.text(floor.name, pageWidth / 2, yPosition, { align: 'center' });
    }

    // Add employees list
    yPosition += 20;
    doc.setFontSize(12);
    
    room.seats?.forEach(seat => {
      if (seat.employees && seat.employees.length > 0) {
        seat.employees.forEach(employee => {
          const text = `${seat.seatNumber}: ${employee.fullName} - ${employee.occupation}`;
          doc.text(text, 20, yPosition);
          yPosition += 10;
        });
      }
    });

    // Save the PDF
    doc.save(`room-${room.roomNumber}-label.pdf`);
  }

  onAddSeat(room: Room, event: MouseEvent): void {
    event.stopPropagation();

    this.addingSeatRoomId = room.id;

    const newSeatNumber = this.generateSeatNumber(room);

     const seat = {
      room: room,
      seatNumber: newSeatNumber
    };

    this.floorService.addSeat(seat)
      .pipe(finalize(() => this.addingSeatRoomId = null))
      .subscribe({
        next: () => {
          this.dashboardService.resetStats();
          this.snackBar.open('Seat added successfully!', 'Close', {
            duration: 3000,
            verticalPosition: 'top'
          });
        },
        error: (err) => {
          console.error('Failed to add seat:', err);
          this.snackBar.open(err.message || 'Failed to add seat. Please try again', 'Close', {
            duration: 5000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private generateSeatNumber(room: Room): string {
    const roomNumber = room.roomNumber;

    const existingSeatNumbers: number[] = room.seats?.map(seat => {
      const parts = seat.seatNumber.split('-');
      if (parts.length === 2) {
        return parseInt(parts[1], 10);
      }
      return 0;
    })
    .filter(num => num > 0)
    .sort((a, b) => a - b) || [];

    let nextSeatNum = 1;

    for (let i = 0; i < existingSeatNumbers.length; i++) {
      if (existingSeatNumbers[i] === nextSeatNum) {
        nextSeatNum++;
      }
      else if (existingSeatNumbers[i] > nextSeatNum) {
        break;
      }
    }
    
    const formattedSeatNum = nextSeatNum.toString().padStart(2, '0');

    return `${roomNumber}-${formattedSeatNum}`;
  }

  onDeleteSeat(seatId: number, seatNumber: string, event: MouseEvent): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(DeleteSeatDialogComponent, {
      width: '400px',
      data: { seatNumber }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      
      this.deletingSeatId = seatId;

      this.floorService.deleteSeat(seatId)
        .pipe(finalize(() => this.deletingSeatId = null))
        .subscribe({
          next: () => {
            this.dashboardService.resetStats();
            this.snackBar.open('Seat deleted successfully!', 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
          },
          error: (err) => {
            console.error('Failed to delete seat:', err);
            this.snackBar.open(err.message || 'Failed to delete seat. Please try again', 'Close', {
              duration: 5000,
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    });
  }
} 