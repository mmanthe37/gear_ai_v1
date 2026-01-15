/**
 * Gear AI CoPilot - Form Validation Schemas
 * 
 * Zod schemas for validating authentication forms
 */

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation: min 8 chars, 1 uppercase, 1 number
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!passwordRegex.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least 1 uppercase letter and 1 number' 
    };
  }
  return { valid: true };
}

/**
 * Validate password confirmation matches
 */
export function validatePasswordConfirmation(
  password: string, 
  confirmPassword: string
): { valid: boolean; error?: string } {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
}

/**
 * Validate login form
 */
export function validateLoginForm(email: string, password: string): { 
  valid: boolean; 
  errors: { email?: string; password?: string } 
} {
  const errors: { email?: string; password?: string } = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }
  
  if (!password) {
    errors.password = 'Password is required';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate signup form
 */
export function validateSignUpForm(
  email: string, 
  password: string, 
  confirmPassword: string
): { 
  valid: boolean; 
  errors: { email?: string; password?: string; confirmPassword?: string } 
} {
  const errors: { email?: string; password?: string; confirmPassword?: string } = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }
  
  const confirmValidation = validatePasswordConfirmation(password, confirmPassword);
  if (!confirmValidation.valid) {
    errors.confirmPassword = confirmValidation.error;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate forgot password form
 */
export function validateForgotPasswordForm(email: string): { 
  valid: boolean; 
  errors: { email?: string } 
} {
  const errors: { email?: string } = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
