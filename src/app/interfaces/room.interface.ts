import { Seat } from './seat.interface';
import { Floor } from './floor.interface';

export interface Room {
  id: number;
  floor?: Floor;  // Consider a simplified Floor reference
  roomNumber: string;
  name: string;
  createdAt?: string; // Changed from number[] to string
  seats?: Seat[]; // Made optional as it's included in detailed view
}
