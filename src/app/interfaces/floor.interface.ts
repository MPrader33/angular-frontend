import { Room } from './room.interface';

export interface Floor {
  id: number;
  floorNumber: number;
  name: string;
  planimetry?: string;
  createdAt?: string;
  rooms?: Room[];
}
