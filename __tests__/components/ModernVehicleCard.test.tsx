/**
 * Tests for ModernVehicleCard Component
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import ModernVehicleCard from '../../components/ModernVehicleCard';
import { render } from '../utils/test-utils';

describe('ModernVehicleCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render vehicle data correctly', () => {
    // Arrange & Act
    const { getByText } = render(
      <ModernVehicleCard
        make="Toyota"
        model="Supra"
        year={2023}
        vin="1HGBH41JXMN109186"
        mileage={15000}
        onPress={mockOnPress}
      />
    );

    // Assert
    expect(getByText('Toyota Supra')).toBeTruthy();
    expect(getByText('2023')).toBeTruthy();
  });

  it('should display last 6 characters of VIN', () => {
    // Arrange & Act
    const { getByText } = render(
      <ModernVehicleCard
        make="BMW"
        model="M3"
        year={2022}
        vin="WBA3B3C51EF123456"
        onPress={mockOnPress}
      />
    );

    // Assert
    expect(getByText('VIN: 123456')).toBeTruthy();
  });

  it('should display formatted mileage', () => {
    // Arrange & Act
    const { getByText } = render(
      <ModernVehicleCard
        make="Honda"
        model="Civic"
        year={2024}
        mileage={25000}
        onPress={mockOnPress}
      />
    );

    // Assert
    expect(getByText('25,000 mi')).toBeTruthy();
  });

  it('should call onPress when card is pressed', () => {
    // Arrange
    const { getByText } = render(
      <ModernVehicleCard
        make="Toyota"
        model="Supra"
        year={2023}
        onPress={mockOnPress}
      />
    );

    // Act
    const card = getByText('Toyota Supra').parent?.parent?.parent?.parent;
    if (card) {
      fireEvent.press(card);
    }

    // Assert
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should render without VIN', () => {
    // Arrange & Act
    const { queryByText, getByText } = render(
      <ModernVehicleCard
        make="Ford"
        model="Mustang"
        year={2021}
        onPress={mockOnPress}
      />
    );

    // Assert
    expect(getByText('Ford Mustang')).toBeTruthy();
    expect(queryByText(/VIN:/)).toBeNull();
  });

  it('should render without mileage', () => {
    // Arrange & Act
    const { queryByText, getByText } = render(
      <ModernVehicleCard
        make="Chevrolet"
        model="Corvette"
        year={2023}
        onPress={mockOnPress}
      />
    );

    // Assert
    expect(getByText('Chevrolet Corvette')).toBeTruthy();
    expect(queryByText(/mi$/)).toBeNull();
  });

  it('should render all details when both VIN and mileage provided', () => {
    // Arrange & Act
    const { getByText } = render(
      <ModernVehicleCard
        make="Porsche"
        model="911"
        year={2024}
        vin="WP0AA2A99PS123456"
        mileage={5000}
        onPress={mockOnPress}
      />
    );

    // Assert
    expect(getByText('Porsche 911')).toBeTruthy();
    expect(getByText('2024')).toBeTruthy();
    expect(getByText('VIN: 123456')).toBeTruthy();
    expect(getByText('5,000 mi')).toBeTruthy();
  });

  it('should handle zero mileage correctly', () => {
    // Arrange & Act
    const { queryByText } = render(
      <ModernVehicleCard
        make="Tesla"
        model="Model 3"
        year={2024}
        mileage={0}
        onPress={mockOnPress}
      />
    );

    // Assert - Zero mileage should not display (falsy check in component)
    expect(queryByText(/mi$/)).toBeNull();
  });

  it('should handle large mileage values with proper formatting', () => {
    // Arrange & Act
    const { getByText } = render(
      <ModernVehicleCard
        make="Toyota"
        model="Camry"
        year={2015}
        mileage={150000}
        onPress={mockOnPress}
      />
    );

    // Assert
    expect(getByText('150,000 mi')).toBeTruthy();
  });
});
