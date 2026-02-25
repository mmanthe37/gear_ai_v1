/**
 * Test Utilities - Mock Data
 * 
 * Mock data for testing vehicles, users, and maintenance records
 */

import { User } from '../../types/user';
import { Vehicle } from '../../types/vehicle';
import { User as FirebaseUser } from 'firebase/auth';

export const mockFirebaseUser: Partial<FirebaseUser> = {
  uid: 'test-firebase-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
};

export const mockUser: User = {
  user_id: 'test-user-id-123',
  firebase_uid: 'test-firebase-uid-123',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: undefined,
  tier: 'free',
  subscription_status: 'none',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  last_login_at: '2024-01-01T00:00:00Z',
  preferences: {
    notifications_enabled: true,
    theme: 'auto',
    distance_unit: 'miles',
  },
};

export const mockVehicles: Vehicle[] = [
  {
    vehicle_id: 'vehicle-1',
    user_id: 'test-user-id-123',
    vin: '1HGBH41JXMN109186',
    year: 2023,
    make: 'Toyota',
    model: 'Supra',
    trim: 'GR',
    engine_displacement_l: 3.0,
    engine_cylinders: 6,
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    drivetrain: 'RWD',
    body_type: 'Coupe',
    current_mileage: 15000,
    color: 'Red',
    license_plate: 'ABC123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
  },
  {
    vehicle_id: 'vehicle-2',
    user_id: 'test-user-id-123',
    vin: 'WBA3B3C51EF123456',
    year: 2022,
    make: 'BMW',
    model: 'M3',
    trim: 'Competition',
    engine_displacement_l: 3.0,
    engine_cylinders: 6,
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    drivetrain: 'RWD',
    body_type: 'Sedan',
    current_mileage: 8500,
    color: 'Blue',
    license_plate: 'XYZ789',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    is_active: true,
  },
];

export const mockVehicleFormData = {
  make: 'Honda',
  model: 'Civic',
  year: 2024,
  vin: '19XFC2F59RE123456',
  mileage: 100,
  color: 'Silver',
};

export const mockMaintenanceRecords = [
  {
    maintenance_id: 'maint-1',
    vehicle_id: 'vehicle-1',
    service_type: 'Oil Change',
    description: 'Regular oil change service',
    service_date: '2024-01-15T00:00:00Z',
    mileage_at_service: 14500,
    cost: 45.99,
    performed_by: 'Auto Shop',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    maintenance_id: 'maint-2',
    vehicle_id: 'vehicle-1',
    service_type: 'Tire Rotation',
    description: 'Rotated all four tires',
    service_date: '2024-01-10T00:00:00Z',
    mileage_at_service: 14000,
    cost: 25.00,
    performed_by: 'Tire Center',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
];
