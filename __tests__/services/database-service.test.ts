/**
 * Tests for Database Service
 */

import * as dbService from '../../services/database-service';
import { supabase } from '../../lib/supabase';
import { mockVehicles, mockVehicleFormData } from '../utils/mock-data';

jest.mock('../../lib/supabase');

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createVehicle', () => {
    it('should successfully create a vehicle', async () => {
      // Arrange
      const userId = 'test-user-id-123';
      const vehicleData = mockVehicleFormData;

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockVehicles[0], error: null }),
      });

      // Act
      const result = await dbService.createVehicle(userId, vehicleData);

      // Assert
      expect(result).toBeDefined();
      expect(result.make).toBe(mockVehicles[0].make);
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const userId = 'test-user-id-123';
      const vehicleData = mockVehicleFormData;

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      });

      // Act & Assert
      await expect(dbService.createVehicle(userId, vehicleData)).rejects.toThrow('Database error');
    });

    it('should handle network failures', async () => {
      // Arrange
      const userId = 'test-user-id-123';
      const vehicleData = mockVehicleFormData;

      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Network error');
      });

      // Act & Assert
      await expect(dbService.createVehicle(userId, vehicleData)).rejects.toThrow('Network error');
    });
  });

  describe('getUserVehicles', () => {
    it('should return all user vehicles', async () => {
      // Arrange
      const userId = 'test-user-id-123';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null }),
      });

      // Act
      const result = await dbService.getUserVehicles(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].make).toBe('Toyota');
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
    });

    it('should return empty array when user has no vehicles', async () => {
      // Arrange
      const userId = 'test-user-id-123';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      // Act
      const result = await dbService.getUserVehicles(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error on fetch failure', async () => {
      // Arrange
      const userId = 'test-user-id-123';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      });

      // Act & Assert
      await expect(dbService.getUserVehicles(userId)).rejects.toThrow('Fetch failed');
    });
  });

  describe('updateVehicle', () => {
    it('should successfully update vehicle mileage', async () => {
      // Arrange
      const vehicleId = 'vehicle-1';
      const updates = { mileage: 20000 };
      const updatedVehicle = { ...mockVehicles[0], current_mileage: 20000 };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedVehicle, error: null }),
      });

      // Act
      const result = await dbService.updateVehicle(vehicleId, updates);

      // Assert
      expect(result).toBeDefined();
      expect(result.current_mileage).toBe(20000);
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
    });

    it('should successfully update vehicle color', async () => {
      // Arrange
      const vehicleId = 'vehicle-1';
      const updates = { color: 'Blue' };
      const updatedVehicle = { ...mockVehicles[0], color: 'Blue' };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedVehicle, error: null }),
      });

      // Act
      const result = await dbService.updateVehicle(vehicleId, updates);

      // Assert
      expect(result.color).toBe('Blue');
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const vehicleId = 'vehicle-1';
      const updates = { mileage: 20000 };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      });

      // Act & Assert
      await expect(dbService.updateVehicle(vehicleId, updates)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteVehicle', () => {
    it('should successfully soft delete a vehicle', async () => {
      // Arrange
      const vehicleId = 'vehicle-1';

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Act
      await dbService.deleteVehicle(vehicleId);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
    });

    it('should throw error when delete fails', async () => {
      // Arrange
      const vehicleId = 'vehicle-1';

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });

      // Act & Assert
      await expect(dbService.deleteVehicle(vehicleId)).rejects.toThrow('Delete failed');
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle when found', async () => {
      // Arrange
      const vehicleId = 'vehicle-1';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockVehicles[0], error: null }),
      });

      // Act
      const result = await dbService.getVehicleById(vehicleId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.vehicle_id).toBe(vehicleId);
    });

    it('should return null when vehicle not found', async () => {
      // Arrange
      const vehicleId = 'non-existent';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      });

      // Act
      const result = await dbService.getVehicleById(vehicleId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserVehicleCount', () => {
    it('should return correct vehicle count', async () => {
      // Arrange
      const userId = 'test-user-id-123';

      // Create a proper mock chain
      const mockEq2 = jest.fn().mockResolvedValue({ count: 2, error: null });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await dbService.getUserVehicleCount(userId);

      // Assert
      expect(result).toBe(2);
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('should return 0 when count fails', async () => {
      // Arrange
      const userId = 'test-user-id-123';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: null, error: { message: 'Count failed' } }),
      });

      // Act
      const result = await dbService.getUserVehicleCount(userId);

      // Assert
      expect(result).toBe(0);
    });
  });
});
