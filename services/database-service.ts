/**
 * Gear AI CoPilot - Database Service
 * 
 * CRUD operations for vehicles and maintenance records using Supabase
 */

import { supabase } from '../lib/supabase';
import { Vehicle, MaintenanceRecord } from '../types';

/**
 * Vehicle Input type for creating new vehicles
 */
export interface VehicleInput {
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
  in_service_date?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_market_value?: number;
  current_mileage?: number;
  profile_image?: string;
  color?: string;
  license_plate?: string;
}

/**
 * Maintenance Input type for creating new maintenance records
 */
export interface MaintenanceInput {
  type: 'routine' | 'repair' | 'modification' | 'diagnostic' | 'inspection';
  date: string;
  mileage?: number;
  title: string;
  description?: string;
  cost?: number;
  labor_cost?: number;
  parts_cost?: number;
  shop_name?: string;
  shop_location?: string;
  technician_name?: string;
  dtc_codes?: string[];
  parts_replaced?: string[];
  attachment_urls?: string[];
  next_service_date?: string;
  next_service_mileage?: number;
  warranty_covered?: boolean;
}

// ============================================================================
// VEHICLE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new vehicle
 */
export async function createVehicle(
  userId: string,
  vehicleData: VehicleInput
): Promise<Vehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: userId,
        ...vehicleData,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create vehicle: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from vehicle creation');
    }

    return data as Vehicle;
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }
}

/**
 * Get all vehicles for a user
 */
export async function getUserVehicles(userId: string): Promise<Vehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }

    return (data || []) as Vehicle[];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
}

/**
 * Get a specific vehicle by ID
 */
export async function getVehicleById(vehicleId: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch vehicle: ${error.message}`);
    }

    return data as Vehicle;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw error;
  }
}

/**
 * Update a vehicle
 */
export async function updateVehicle(
  vehicleId: string,
  updates: Partial<Vehicle>
): Promise<Vehicle> {
  try {
    // Remove fields that shouldn't be updated
    const { vehicle_id, user_id, created_at, ...allowedUpdates } = updates as any;

    const { data, error } = await supabase
      .from('vehicles')
      .update(allowedUpdates)
      .eq('vehicle_id', vehicleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update vehicle: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from vehicle update');
    }

    return data as Vehicle;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
}

/**
 * Delete a vehicle (soft delete by setting is_active to false)
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('vehicle_id', vehicleId);

    if (error) {
      throw new Error(`Failed to delete vehicle: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
}

// ============================================================================
// MAINTENANCE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new maintenance record
 */
export async function createMaintenanceRecord(
  vehicleId: string,
  record: MaintenanceInput
): Promise<MaintenanceRecord> {
  try {
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert({
        vehicle_id: vehicleId,
        ...record,
        warranty_covered: record.warranty_covered || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create maintenance record: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from maintenance record creation');
    }

    return data as MaintenanceRecord;
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    throw error;
  }
}

/**
 * Get maintenance history for a vehicle
 */
export async function getVehicleMaintenanceHistory(
  vehicleId: string
): Promise<MaintenanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch maintenance records: ${error.message}`);
    }

    return (data || []) as MaintenanceRecord[];
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    throw error;
  }
}

/**
 * Update a maintenance record
 */
export async function updateMaintenanceRecord(
  recordId: string,
  updates: Partial<MaintenanceRecord>
): Promise<MaintenanceRecord> {
  try {
    // Remove fields that shouldn't be updated
    const { record_id, vehicle_id, created_at, ...allowedUpdates } = updates as any;

    const { data, error } = await supabase
      .from('maintenance_records')
      .update(allowedUpdates)
      .eq('record_id', recordId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update maintenance record: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from maintenance record update');
    }

    return data as MaintenanceRecord;
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    throw error;
  }
}

/**
 * Delete a maintenance record
 */
export async function deleteMaintenanceRecord(recordId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('record_id', recordId);

    if (error) {
      throw new Error(`Failed to delete maintenance record: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is authenticated
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Handle network errors and provide user-friendly messages
 */
export function getErrorMessage(error: any): string {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (error?.message?.includes('RLS')) {
    return 'You do not have permission to perform this action.';
  }

  if (error?.message?.includes('violates')) {
    return 'Invalid data. Please check your input and try again.';
  }

  return error?.message || 'An unexpected error occurred. Please try again.';
}
