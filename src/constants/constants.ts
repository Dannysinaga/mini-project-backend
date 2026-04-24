// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Auth errors
  EMAIL_EXISTS: 'Email already registered',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
  NO_TOKEN: 'No token provided',
  
  // Validation errors
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
  INVALID_EMAIL: 'Invalid email format',
  
  // User errors
  USER_NOT_FOUND: 'User not found',
  INCORRECT_PASSWORD: 'Current password is incorrect',
  
  // Server errors
  INTERNAL_ERROR: 'Internal server error'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully'
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  EXPIRES_IN: '7d' as const
};