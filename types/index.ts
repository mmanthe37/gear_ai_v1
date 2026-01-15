/**
 * Gear AI CoPilot - Type Definitions Index
 * 
 * Central export for all type definitions
 */

export * from './vehicle';
export * from './diagnostic';
export * from './maintenance';
export * from './user';
export * from './chat';
export * from './financial';
export * from './database';

// Common utility types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  formatted?: string;
}
