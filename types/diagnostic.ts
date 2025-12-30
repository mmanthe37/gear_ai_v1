/**
 * Gear AI CoPilot - Diagnostic Type Definitions
 * 
 * Data models for OBD-II diagnostics and trouble codes
 */

export interface DiagnosticCode {
  diagnostic_id: string;
  vehicle_id: string;
  code: string;
  code_type: 'P' | 'C' | 'B' | 'U'; // Powertrain, Chassis, Body, Network
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string; // ISO timestamp
  cleared_at?: string; // ISO timestamp
  status: 'active' | 'pending' | 'resolved' | 'false_positive';
  mileage_at_detection?: number;
  freeze_frame_data?: FreezeFrameData;
  ai_analysis?: string;
  recommended_actions?: string[];
  estimated_repair_cost_min?: number;
  estimated_repair_cost_max?: number;
  related_maintenance_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface FreezeFrameData {
  rpm?: number;
  vehicle_speed?: number;
  engine_load?: number;
  coolant_temp?: number;
  fuel_trim_short?: number;
  fuel_trim_long?: number;
  intake_pressure?: number;
  timing_advance?: number;
  throttle_position?: number;
  [key: string]: any; // Additional PIDs
}

export interface OBDParameter {
  pid: string; // Parameter ID (e.g., "01 0C" for RPM)
  name: string;
  value: number;
  unit: string;
  description: string;
  timestamp: number;
}

export interface OBDConnection {
  adapter_id: string;
  adapter_name: string;
  connection_type: 'BLE' | 'WiFi' | 'USB';
  protocol: 'CAN' | 'ISO9141' | 'KWP2000' | 'J1850PWM' | 'J1850VPW';
  connected_at: string;
  is_connected: boolean;
}

export interface DiagnosticScan {
  scan_id: string;
  vehicle_id: string;
  scan_date: string;
  mileage: number;
  codes_found: DiagnosticCode[];
  live_data?: OBDParameter[];
  adapter_info: OBDConnection;
  duration_seconds: number;
}

export type DiagnosticCodeType = {
  prefix: 'P' | 'C' | 'B' | 'U';
  name: 'Powertrain' | 'Chassis' | 'Body' | 'Network';
  description: string;
};

export const DiagnosticCodeTypes: Record<string, DiagnosticCodeType> = {
  P: {
    prefix: 'P',
    name: 'Powertrain',
    description: 'Engine and transmission issues',
  },
  C: {
    prefix: 'C',
    name: 'Chassis',
    description: 'Suspension, steering, braking systems',
  },
  B: {
    prefix: 'B',
    name: 'Body',
    description: 'Interior electronics, airbags, climate control',
  },
  U: {
    prefix: 'U',
    name: 'Network',
    description: 'Communication between modules',
  },
};

export interface DTCAnalysis {
  code: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimated_cost_min: number;
  estimated_cost_max: number;
  labor_cost: number;
  parts_cost: number;
  tech_service_bulletins: string[];
  common_causes: string[];
  symptoms: string[];
  repair_difficulty: 'easy' | 'moderate' | 'difficult' | 'professional';
}
