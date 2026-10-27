import type { Page, PageRequest } from '../models/pagination';
import type { VehicleUsage, VehicleUsageInput } from '../models/vehicleUsage';

export interface VehicleUsageRepository {
  list(page: PageRequest): Promise<Page<VehicleUsage>>;
  findById(id: string): Promise<VehicleUsage | null>;
  findActiveByVehicle(vehicleId: string): Promise<VehicleUsage | null>;
  findActiveByDriver(driverId: string): Promise<VehicleUsage | null>;
  create(data: VehicleUsageInput): Promise<VehicleUsage>;
  finish(id: string, endDate: Date): Promise<VehicleUsage>;
}
