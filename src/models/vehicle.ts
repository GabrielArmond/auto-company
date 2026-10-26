export interface Vehicle {
  id: string;
  plate: string;
  color: string;
  brand: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleInput = Pick<Vehicle, 'plate' | 'color' | 'brand'>;

export interface VehicleFilters {
  color?: string;
  brand?: string;
}
