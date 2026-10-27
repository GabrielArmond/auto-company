import type { Driver, DriverFilters, DriverInput } from '../models/driver';
import type { Page, PageRequest } from '../models/pagination';

export interface DriverRepository {
  list(filters: DriverFilters, page: PageRequest): Promise<Page<Driver>>;
  findById(id: string): Promise<Driver | null>;
  create(data: DriverInput): Promise<Driver>;
  update(id: string, data: DriverInput): Promise<Driver>;
  delete(id: string): Promise<void>;
}
