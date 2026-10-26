import type { Driver, DriverFilters, DriverInput } from '../models/driver';

export interface DriverRepository {
  list(filters?: DriverFilters): Promise<Driver[]>;
  findById(id: string): Promise<Driver | null>;
  create(data: DriverInput): Promise<Driver>;
  update(id: string, data: DriverInput): Promise<Driver>;
  delete(id: string): Promise<void>;
}
