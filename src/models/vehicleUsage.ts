import type { Driver } from './driver';
import type { Vehicle } from './vehicle';

export type DriverSummary = Pick<Driver, 'id' | 'name'>;
export type VehicleSummary = Pick<Vehicle, 'id' | 'plate' | 'color' | 'brand'>;

export interface VehicleUsage {
  id: string;
  driver: DriverSummary;
  vehicle: VehicleSummary;
  reason: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleUsageInput {
  driver: DriverSummary;
  vehicle: VehicleSummary;
  reason: string;
  startDate: Date;
}
