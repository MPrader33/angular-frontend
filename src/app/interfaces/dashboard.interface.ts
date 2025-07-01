export interface DashboardStats {
  totalEmployees: number;
  totalFloors: number;
  totalOffices: number;
  totalSeats: number;
}

// Keeping the original interface for backward compatibility
export interface DetailedDashboardStats extends DashboardStats {
  occupancyRate: number;
  officesPerFloor: { floorNumber: number; officeCount: number }[];
  seatsPerFloor: { floorNumber: number; seatCount: number }[];
} 