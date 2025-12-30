/**
 * Gear AI CoPilot - VIN Decoder Service
 * 
 * Integrates with NHTSA vPIC API for VIN decoding
 */

import { VINDecodeResult } from '../types';

const NHTSA_API_BASE = 'https://vpic.nhtsa.dot.gov/api';

/**
 * Decode a VIN using the NHTSA vPIC API
 * @param vin - 17-character Vehicle Identification Number
 * @param year - Optional model year for more accurate results
 * @returns Decoded vehicle information
 */
export async function decodeVIN(
  vin: string,
  year?: number
): Promise<VINDecodeResult> {
  // Validate VIN format
  if (!isValidVIN(vin)) {
    throw new Error('Invalid VIN format. VIN must be exactly 17 characters and cannot contain I, O, or Q.');
  }

  const sanitizedVIN = vin.toUpperCase().replace(/\s/g, '');
  const yearParam = year ? `&modelyear=${year}` : '';
  const url = `${NHTSA_API_BASE}/vehicles/DecodeVin/${sanitizedVIN}?format=json${yearParam}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.Results || data.Results.length === 0) {
      throw new Error('Failed to decode VIN. No results returned from NHTSA.');
    }

    return parseNHTSAResponse(sanitizedVIN, data.Results);
  } catch (error) {
    console.error('VIN decode error:', error);
    throw new Error(`Failed to decode VIN: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate VIN format
 */
function isValidVIN(vin: string): boolean {
  if (vin.length !== 17) return false;
  if (/[IOQ]/i.test(vin)) return false; // VINs cannot contain I, O, or Q
  return true;
}

/**
 * Parse NHTSA API response into VINDecodeResult
 */
function parseNHTSAResponse(vin: string, results: any[]): VINDecodeResult {
  const getValue = (variableId: number): string | undefined => {
    const result = results.find(r => r.VariableId === variableId);
    return result?.Value || undefined;
  };

  const getNumericValue = (variableId: number): number | undefined => {
    const value = getValue(variableId);
    return value ? parseFloat(value) : undefined;
  };

  // Check for errors
  const errorCode = getValue(143);
  if (errorCode && errorCode !== '0') {
    return {
      vin,
      year: getNumericValue(29) || new Date().getFullYear(),
      make: getValue(26) || 'Unknown',
      model: getValue(28) || 'Unknown',
      error_code: errorCode,
      error_message: `VIN decode error: ${errorCode}`,
    };
  }

  return {
    vin,
    year: getNumericValue(29) || new Date().getFullYear(),
    make: getValue(26) || 'Unknown',
    model: getValue(28) || 'Unknown',
    trim: getValue(38) || getValue(109), // Trim or Trim2
    engine_displacement_l: getNumericValue(13),
    engine_cylinders: getNumericValue(9),
    fuel_type: getValue(24),
    transmission: getValue(10),
    drivetrain: getValue(15),
    body_type: getValue(5),
    plant_country: getValue(75),
    plant_city: getValue(31),
  };
}

/**
 * Get make/model suggestions for autocomplete
 * @param year - Optional year to filter results
 */
export async function getMakesForYear(year?: number): Promise<string[]> {
  const yearParam = year || new Date().getFullYear();
  const url = `${NHTSA_API_BASE}/vehicles/GetMakesForVehicleType/car?format=json&year=${yearParam}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.Results) return [];

    return data.Results.map((result: any) => result.MakeName).sort();
  } catch (error) {
    console.error('Error fetching makes:', error);
    return [];
  }
}

/**
 * Get models for a specific make and year
 */
export async function getModelsForMake(
  make: string,
  year?: number
): Promise<string[]> {
  const yearParam = year || new Date().getFullYear();
  const url = `${NHTSA_API_BASE}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${yearParam}?format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.Results) return [];

    return data.Results.map((result: any) => result.Model_Name).sort();
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

/**
 * Validate VIN checksum (ISO 3779 standard)
 * @param vin - 17-character VIN
 * @returns true if checksum is valid
 */
export function validateVINChecksum(vin: string): boolean {
  if (vin.length !== 17) return false;

  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const transliteration: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  };

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    let value: number;

    if (/\d/.test(char)) {
      value = parseInt(char, 10);
    } else {
      value = transliteration[char] || 0;
    }

    sum += value * weights[i];
  }

  const checkDigit = sum % 11;
  const expectedCheckDigit = vin[8];

  if (checkDigit === 10) {
    return expectedCheckDigit === 'X';
  }

  return expectedCheckDigit === checkDigit.toString();
}
