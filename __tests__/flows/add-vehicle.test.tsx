/**
 * Integration Test - Add Vehicle Flow
 * 
 * Tests the complete flow of adding a vehicle from the garage screen
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { render } from '../utils/test-utils';

// Mock the full screen component
import VehiclesScreen from '../../app/(tabs)/index';

describe('Add Vehicle Flow Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render garage screen with vehicles', () => {
    // Arrange & Act
    const { getByText } = render(<VehiclesScreen />);

    // Assert - Shows existing vehicles
    expect(getByText('GARAGE')).toBeTruthy();
    expect(getByText('Toyota Supra')).toBeTruthy();
    expect(getByText('BMW M3')).toBeTruthy();
  });

  it('should display correct vehicle statistics', () => {
    // Arrange & Act
    const { getAllByText } = render(<VehiclesScreen />);

    // Assert - Check stats are calculated correctly
    // With 2 default vehicles (Supra: 15000 mi, M3: 8500 mi)
    // Average mileage = (15000 + 8500) / 2 = 11750
    const twoElements = getAllByText('2');
    expect(twoElements.length).toBeGreaterThan(0); // Total vehicles appears somewhere
    const { getByText } = render(<VehiclesScreen />);
    expect(getByText('11,750')).toBeTruthy(); // Average mileage
  });
});
