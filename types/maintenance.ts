/**
 * Gear AI CoPilot - Maintenance Type Definitions
 * 
 * Data models for service history and maintenance tracking
 */

export interface MaintenanceRecord {
  record_id: string;
  vehicle_id: string;
  type: 'routine' | 'repair' | 'modification' | 'diagnostic' | 'inspection';
  date: string; // ISO date string
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
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ServiceReminder {
  reminder_id: string;
  vehicle_id: string;
  service_type: string; // e.g., 'oil_change', 'tire_rotation'
  title: string;
  description?: string;
  due_mileage?: number;
  due_date?: string; // ISO date string
  interval_miles?: number;
  interval_months?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'upcoming' | 'due' | 'overdue' | 'completed' | 'dismissed';
  notification_sent: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface MaintenanceSchedule {
  vehicle_id: string;
  make: string;
  model: string;
  year: number;
  schedule: MaintenanceInterval[];
}

export interface MaintenanceInterval {
  service_type: string;
  description: string;
  first_interval_miles: number;
  first_interval_months: number;
  recurring_interval_miles?: number;
  recurring_interval_months?: number;
  estimated_cost_min: number;
  estimated_cost_max: number;
  severity: 'critical' | 'important' | 'recommended' | 'optional';
}

export type MaintenanceType = 
  | 'routine'
  | 'repair'
  | 'modification'
  | 'diagnostic'
  | 'inspection';

export const MaintenanceTypes: Record<MaintenanceType, string> = {
  routine: 'Routine Maintenance',
  repair: 'Repair',
  modification: 'Modification/Upgrade',
  diagnostic: 'Diagnostic',
  inspection: 'Inspection',
};

export interface MaintenanceFormData {
  type: MaintenanceType;
  date: string;
  mileage?: number;
  title: string;
  description?: string;
  cost?: number;
  labor_cost?: number;
  parts_cost?: number;
  shop_name?: string;
  shop_location?: string;
  parts_replaced?: string[];
  photos?: File[] | string[];
}

export interface MaintenanceStats {
  total_services: number;
  total_cost: number;
  average_cost_per_service: number;
  last_service_date?: string;
  next_service_due?: string;
  overdue_services: number;
}

// Common maintenance service types
export const CommonServiceTypes = {
  OIL_CHANGE: {
    name: 'Oil Change',
    typical_interval_miles: 5000,
    typical_interval_months: 6,
    typical_cost_min: 35,
    typical_cost_max: 75,
  },
  TIRE_ROTATION: {
    name: 'Tire Rotation',
    typical_interval_miles: 7500,
    typical_interval_months: 6,
    typical_cost_min: 20,
    typical_cost_max: 50,
  },
  AIR_FILTER: {
    name: 'Air Filter Replacement',
    typical_interval_miles: 15000,
    typical_interval_months: 12,
    typical_cost_min: 15,
    typical_cost_max: 35,
  },
  CABIN_FILTER: {
    name: 'Cabin Air Filter',
    typical_interval_miles: 15000,
    typical_interval_months: 12,
    typical_cost_min: 15,
    typical_cost_max: 40,
  },
  BRAKE_INSPECTION: {
    name: 'Brake Inspection',
    typical_interval_miles: 12000,
    typical_interval_months: 12,
    typical_cost_min: 0,
    typical_cost_max: 50,
  },
  BRAKE_PADS: {
    name: 'Brake Pad Replacement',
    typical_interval_miles: 40000,
    typical_interval_months: 48,
    typical_cost_min: 150,
    typical_cost_max: 400,
  },
  COOLANT_FLUSH: {
    name: 'Coolant Flush',
    typical_interval_miles: 30000,
    typical_interval_months: 24,
    typical_cost_min: 100,
    typical_cost_max: 200,
  },
  TRANSMISSION_FLUID: {
    name: 'Transmission Fluid',
    typical_interval_miles: 60000,
    typical_interval_months: 48,
    typical_cost_min: 100,
    typical_cost_max: 250,
  },
  SPARK_PLUGS: {
    name: 'Spark Plug Replacement',
    typical_interval_miles: 60000,
    typical_interval_months: 60,
    typical_cost_min: 100,
    typical_cost_max: 300,
  },
  TIMING_BELT: {
    name: 'Timing Belt Replacement',
    typical_interval_miles: 100000,
    typical_interval_months: 120,
    typical_cost_min: 500,
    typical_cost_max: 1500,
  },
  TIRE_REPLACEMENT: {
    name: 'Tire Replacement',
    typical_interval_miles: 50000,
    typical_interval_months: 60,
    typical_cost_min: 400,
    typical_cost_max: 1200,
  },
  BATTERY: {
    name: 'Battery Replacement',
    typical_interval_miles: 0,
    typical_interval_months: 48,
    typical_cost_min: 100,
    typical_cost_max: 250,
  },
  ALIGNMENT: {
    name: 'Wheel Alignment',
    typical_interval_miles: 20000,
    typical_interval_months: 24,
    typical_cost_min: 75,
    typical_cost_max: 200,
  },
} as const;
