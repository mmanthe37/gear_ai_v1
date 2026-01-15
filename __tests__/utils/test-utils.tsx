/**
 * Test Utilities - Custom Render and Test Helpers
 * 
 * Provides a custom render function with all necessary providers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { AuthProvider } from '../../contexts/AuthContext';

// Custom render that includes all necessary providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
}

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from @testing-library/react-native
export * from '@testing-library/react-native';

// Export the custom render as the default render
export { renderWithProviders as render };
