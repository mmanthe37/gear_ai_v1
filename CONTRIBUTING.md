# Contributing to Gear AI CoPilot

Thank you for your interest in contributing to Gear AI CoPilot! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Submitting Changes](#submitting-changes)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community and the project

## Getting Started

1. **Fork the repository**

   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/gear_ai_v1.git
   cd gear_ai_v1
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up your development environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

## Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**

   - Write clean, maintainable code
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**

   ```bash
   npm run lint
   npm test  # (when tests are implemented)
   npm run build  # Ensure build succeeds
   ```

4. **Commit your changes**

   We use [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat: add vehicle photo upload"
   git commit -m "fix: correct VIN validation logic"
   git commit -m "docs: update API integration guide"
   ```

   Types:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting, etc.)
   - `refactor`: Code refactoring
   - `test`: Adding or updating tests
   - `chore`: Maintenance tasks

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**

   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with a clear description

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and return values
- Avoid using `any` unless absolutely necessary
- Use interfaces for object shapes

```typescript
// Good
interface Vehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
}

function getVehicle(id: string): Promise<Vehicle> {
  // ...
}

// Avoid
function getVehicle(id: any): any {
  // ...
}
```

### React/React Native

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful prop names and destructuring

```typescript
// Good
interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  return (
    <GlassCard onPress={onPress}>
      <Text>{vehicle.make} {vehicle.model}</Text>
    </GlassCard>
  );
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `VehicleCard.tsx`)
- Utilities/Services: `kebab-case.ts` (e.g., `vin-decoder.ts`)
- Types: `PascalCase.ts` (e.g., `Vehicle.ts`)
- Pages (Expo Router): `lowercase.tsx` or `[dynamic].tsx`

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Auto-fix style issues
npm run lint -- --fix

# Check formatting
npx prettier --check .

# Format code
npx prettier --write .
```

### Styling Guidelines

- Use the "Liquid Glass" design system components
- Follow the color palette defined in `docs/DESIGN_SYSTEM.md`
- Ensure components are accessible (proper ARIA labels, contrast ratios)
- Test on both iOS and Android (or use web testing for web-specific changes)

### Comments

- Use JSDoc for functions and components
- Explain "why" not "what" in inline comments
- Keep comments up to date with code changes

```typescript
/**
 * Decode a VIN using the NHTSA vPIC API
 * @param vin - 17-character Vehicle Identification Number
 * @param year - Optional model year for more accurate results
 * @returns Decoded vehicle information
 * @throws {Error} If VIN format is invalid
 */
export async function decodeVIN(
  vin: string,
  year?: number
): Promise<VINDecodeResult> {
  // Implementation
}
```

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows the project's style guidelines
- [ ] All existing tests pass
- [ ] New tests have been added for new features
- [ ] Documentation has been updated
- [ ] Commit messages follow Conventional Commits
- [ ] No sensitive information (API keys, passwords) is committed
- [ ] The PR description clearly explains the changes

### Pull Request Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

How has this been tested? Please describe.

## Screenshots (if applicable)

Add screenshots for UI changes.

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

## Bug Reports

When reporting a bug, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - Device (iOS/Android/Web)
   - OS Version
   - App Version
   - React Native/Expo version
6. **Screenshots/Logs**: If applicable
7. **Additional Context**: Any other relevant information

Use the GitHub issue template for bug reports.

## Feature Requests

When requesting a feature, please include:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How would you like it to work?
3. **Alternatives Considered**: What other solutions have you considered?
4. **Additional Context**: Mockups, examples, or references
5. **Priority**: How important is this to you?

Use the GitHub issue template for feature requests.

## Development Tips

### Working with Expo

```bash
# Start with cache clearing (if experiencing issues)
npx expo start -c

# Run on specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

### Database Changes

If you make changes to the database schema:

1. Create a new migration file in `supabase/migrations/`
2. Follow the naming convention: `YYYYMMDDHHMMSS_description.sql`
3. Update `docs/DATABASE_SCHEMA.md`
4. Test the migration on a local Supabase instance

### Testing API Integrations

- Use mock data for third-party APIs during development
- Add console logs for debugging (remove before committing)
- Test error handling (network failures, invalid responses)

### Performance Optimization

- Use React.memo() for expensive components
- Implement lazy loading for heavy screens
- Optimize images (use WebP, proper sizing)
- Profile with React DevTools before submitting performance improvements

## Questions?

If you have questions about contributing:

1. Check the [documentation](docs/)
2. Search existing [GitHub Issues](https://github.com/mmanthe37/gear_ai_v1/issues)
3. Open a new issue with the "question" label
4. Join our community discussions (if available)

## Recognition

Contributors will be recognized in:

- The project README
- Release notes for significant contributions
- Our Hall of Fame (when implemented)

Thank you for contributing to Gear AI CoPilot! 🚗🤖

---

**Last Updated**: December 31, 2024
