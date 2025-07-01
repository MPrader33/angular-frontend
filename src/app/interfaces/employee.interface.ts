import { Seat } from './seat.interface';

export interface Employee {
  id: number;
  fullName: string;
  occupation: string;
  createdAt?: string;
  seats?: Seat[];   // Many-to-many. Included when viewing details.
} 