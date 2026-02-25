/**
 * Gear AI CoPilot - Database Service
 * 
 * Handles Supabase database operations for vehicles and maintenance records
 */

import { supabase } from '../lib/supabase';
import { Vehicle, VehicleFormData } from '../types/vehicle';

/**
 * Create a new vehicle in the database
 */
export async function createVehicle(userId: string, vehicleData: VehicleFormData): Promise<Vehicle> {
  try {
    const newVehicle = {
      user_id: userId,
      vin: vehicleData.vin || '',
      year: vehicleData.year,
      make: vehicleData.make,
      model: vehicleData.model,
      trim: vehicleData.trim,
      current_mileage: vehicleData.mileage,
      color: vehicleData.color,
      license_plate: vehicleData.license_plate,
      purchase_date: vehicleData.purchase_date,
      purchase_price: vehicleData.purchase_price,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert(newVehicle)
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      throw new Error(error.message || 'Failed to create vehicle');
    }

    console.log('✅ Vehicle created:', data);
    return data;
  } catch (error: any) {
    console.error('Error in createVehicle:', error);
    throw new Error(error.message || 'Failed to create vehicle');
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
      console.error('Error fetching vehicles:', error);
      throw new Error(error.message || 'Failed to fetch vehicles');
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getUserVehicles:', error);
    throw new Error(error.message || 'Failed to fetch vehicles');
  }
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicleById(vehicleId: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();

    if (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    return null;
  }
}

/**
 * Update a vehicle
 */
export async function updateVehicle(vehicleId: string, updates: Partial<VehicleFormData>): Promise<Vehicle> {
  try {
    const updateData: any = {};
    
    if (updates.mileage !== undefined) updateData.current_mileage = updates.mileage;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.license_plate !== undefined) updateData.license_plate = updates.license_plate;
    if (updates.trim !== undefined) updateData.trim = updates.trim;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('vehicle_id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      throw new Error(error.message || 'Failed to update vehicle');
    }

    console.log('✅ Vehicle updated:', data);
    return data;
  } catch (error: any) {
    console.error('Error in updateVehicle:', error);
    throw new Error(error.message || 'Failed to update vehicle');
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
      console.error('Error deleting vehicle:', error);
      throw new Error(error.message || 'Failed to delete vehicle');
    }

    console.log('✅ Vehicle deleted (soft):', vehicleId);
  } catch (error: any) {
    console.error('Error in deleteVehicle:', error);
    throw new Error(error.message || 'Failed to delete vehicle');
  }
}

/**
 * Get vehicle count for a user
 */
export async function getUserVehicleCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error counting vehicles:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUserVehicleCount:', error);
    return 0;
  }
}
