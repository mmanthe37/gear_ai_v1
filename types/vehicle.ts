/**
 * Gear AI CoPilot - Vehicle Type Definitions
 * 
 * Core data models for vehicle management
 */

export interface Vehicle {
  vehicle_id: string;
  user_id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine_displacement_l?: number;
  engine_cylinders?: number;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  body_type?: string;
  plant_country?: string;
  plant_city?: string;
  in_service_date?: string; // ISO date string
  purchase_date?: string; // ISO date string
  purchase_price?: number;
  current_market_value?: number;
  current_mileage?: number;
  profile_image?: string;
  color?: string;
  license_plate?: string;
  manual_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface VehicleFormData {
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  color?: string;
  license_plate?: string;
  purchase_date?: string;
  purchase_price?: number;
}

export interface VINDecodeResult {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine_displacement_l?: number;
  engine_cylinders?: number;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  body_type?: string;
  plant_country?: string;
  plant_city?: string;
  error_code?: string;
  error_message?: string;
}

export interface VehicleStats {
  total_vehicles: number;
  average_mileage: number;
  total_value: number;
  pending_maintenance: number;
  active_diagnostic_codes: number;
}

export type FuelType = 
  | 'Gasoline'
  | 'Diesel'
  | 'Electric'
  | 'Hybrid'
  | 'Plug-in Hybrid'
  | 'Natural Gas'
  | 'Propane'
  | 'Flex Fuel'
  | 'Hydrogen';

export type Drivetrain =
  | 'FWD' // Front-Wheel Drive
  | 'RWD' // Rear-Wheel Drive
  | 'AWD' // All-Wheel Drive
  | '4WD'; // Four-Wheel Drive

export type BodyType =
  | 'Sedan'
  | 'Coupe'
  | 'SUV'
  | 'Truck'
  | 'Van'
  | 'Wagon'
  | 'Convertible'
  | 'Hatchback'
  | 'Minivan';
