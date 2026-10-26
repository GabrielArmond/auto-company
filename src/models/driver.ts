export interface Driver {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type DriverInput = Pick<Driver, 'name'>;

export interface DriverFilters {
  name?: string;
}
