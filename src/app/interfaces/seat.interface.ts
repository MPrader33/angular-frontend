import { Room } from './room.interface';
import { Employee } from './employee.interface';

export interface Seat {
  id: number;
  room?: Room;
  seatNumber: string;
  createdAt?: string;
  employees?: Employee[];
  occupied?: boolean;
}
