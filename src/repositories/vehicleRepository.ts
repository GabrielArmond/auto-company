import type { Page, PageRequest } from '../models/pagination';
import type { Vehicle, VehicleFilters, VehicleInput } from '../models/vehicle';

// Contract used by the service; implemented with Firestore and, in tests, in memory.
export interface VehicleRepository {
  list(filters: VehicleFilters, page: PageRequest): Promise<Page<Vehicle>>;
  findById(id: string): Promise<Vehicle | null>;
  findByPlate(plate: string): Promise<Vehicle | null>;
  create(data: VehicleInput): Promise<Vehicle>;
  update(id: string, data: VehicleInput): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}
