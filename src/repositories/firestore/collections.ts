export const COLLECTIONS = {
  vehicles: 'vehicles',
  vehiclePlates: 'vehiclePlates',
  drivers: 'drivers',
  vehicleUsages: 'vehicleUsages',
  activeUsages: 'activeUsages',
  usageHistory: 'usageHistory',
} as const;

export const vehicleKey = (vehicleId: string) => `vehicle_${vehicleId}`;
export const driverKey = (driverId: string) => `driver_${driverId}`;
