import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete-seat-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete Seat</h2>
    <mat-dialog-content>
      Are you sure you want to delete seat {{data.seatNumber}}?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      margin: 20px 0;
    }
    mat-dialog-actions {
      padding: 16px;
    }
  `]
})
export class DeleteSeatDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteSeatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { seatNumber: string }
  ) {}
}
