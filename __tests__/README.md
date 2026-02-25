# Testing Documentation

## Overview

This project uses Jest and React Native Testing Library for unit, component, and integration testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── AddVehicleModal.test.tsx
│   └── ModernVehicleCard.test.tsx
├── flows/              # Integration tests
│   ├── add-vehicle.test.tsx
│   └── authentication.test.tsx
├── services/           # Service/unit tests
│   ├── auth-service.test.ts
│   └── database-service.test.ts
└── utils/              # Test utilities
    ├── mock-data.ts
    └── test-utils.tsx
```

## Test Coverage

Current coverage: **36% overall**

- **Auth Service**: 79.59% coverage
- **Database Service**: 90% coverage
- **AddVehicleModal**: 100% coverage
- **ModernVehicleCard**: 100% coverage
- **AuthContext**: 94% coverage

Coverage thresholds:
- Statements: 35%
- Branches: 23%
- Functions: 25%
- Lines: 35%

## Writing Tests

### Component Tests

```typescript
import { render, fireEvent } from '../utils/test-utils';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

### Service Tests

```typescript
import * as myService from '../../services/my-service';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase');

describe('My Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await myService.getData();
    expect(result).toEqual([]);
  });
});
```

## Mocked Modules

The following modules are automatically mocked in `jest.setup.js`:

- **Firebase Auth**: `firebase/auth`
- **Supabase**: `@supabase/supabase-js`
- **Expo modules**: `expo-constants`, `expo-router`, `expo-linear-gradient`, `expo-blur`, `@expo/vector-icons`
- **React Native**: `Platform`, `Modal`

## Test Utilities

### Custom Render

Use the custom `render` function from `test-utils.tsx` to wrap components with necessary providers:

```typescript
import { render } from '../utils/test-utils';

const { getByText } = render(<MyComponent />);
```

### Mock Data

Import pre-configured mock data from `mock-data.ts`:

```typescript
import { mockUser, mockVehicles, mockFirebaseUser } from '../utils/mock-data';
```

## Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use meaningful test descriptions**: Describe what the test validates
3. **Mock external dependencies**: Firebase, Supabase, etc.
4. **Test error states**: Not just happy paths
5. **Keep tests isolated**: Each test should be independent
6. **Use data-testid**: For reliable element queries when needed

## Example Test Suite

```typescript
describe('AddVehicleModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate required fields', () => {
    // Arrange
    const { getByText } = render(
      <AddVehicleModal visible={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    // Act
    fireEvent.press(getByText('Save'));

    // Assert
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(
      <AddVehicleModal visible={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    // Act
    fireEvent.changeText(getByPlaceholderText('e.g., Toyota'), 'Honda');
    fireEvent.changeText(getByPlaceholderText('e.g., Camry'), 'Civic');
    fireEvent.changeText(getByPlaceholderText('e.g., 2023'), '2024');
    fireEvent.press(getByText('Save'));

    // Assert
    expect(mockOnAdd).toHaveBeenCalledWith({
      make: 'Honda',
      model: 'Civic',
      year: 2024,
      vin: undefined,
    });
  });
});
```

## Troubleshooting

### Tests fail with module not found

Make sure all dependencies are installed:
```bash
npm install
```

### Mock not working

Check that the mock is defined in `jest.setup.js` or at the top of your test file before importing the module being tested.

### Coverage not generated

Run with the coverage flag:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory (excluded from git).

## CI/CD Integration

Tests should be run in CI/CD pipelines:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

## Future Improvements

- Add E2E tests with Detox
- Increase coverage to 60%+
- Add visual regression testing
- Add performance testing
- Mock more edge cases
