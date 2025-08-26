/**
 * Utility functions for the application
 */

/**
 * Generate initials from first and last name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'EM';
};

/**
 * Get a consistent color for a name based on character code
 */
export const getAvatarColor = (name: string, colors: string[]): string => {
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

/**
 * Format email for mailto link
 */
export const formatEmailLink = (email: string): string => {
  return `mailto:${email}`;
};

/**
 * Format phone for tel link
 */
export const formatPhoneLink = (phone: string): string => {
  return `tel:${phone}`;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Safely access nested object properties
 */
export const get = (obj: Record<string, unknown>, path: string, defaultValue: unknown = undefined): unknown => {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }
  
  return result !== undefined ? result : defaultValue;
};

/**
 * Safely get event target value with comprehensive null/undefined checks
 */
export const safeGetEventValue = (event: unknown): string => {
  try {
    if (!event || typeof event !== 'object') return '';
    const e = event as { target?: { value?: unknown; type?: string } };
    if (!e.target || typeof e.target !== 'object') return '';
    const value = e.target.value;
    if (value == null) return '';
    return typeof value === 'string' ? value : String(value);
  } catch {
    return '';
  }
};

/**
 * Safely handle any data that might be null/undefined/malformed
 */
export const safeGet = <T>(data: unknown, defaultValue: T): T => {
  try {
    if (data == null || data === undefined) return defaultValue;
    return data as T;
  } catch {
    return defaultValue;
  }
};

/**
 * Safely handle employee data to prevent undefined access
 */
export const safeEmployee = (employee: unknown): {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  pictureUrl?: string;
  jobTitle: string;
  department: string;
  location: string;
  createdAt: string;
  updatedAt: string;
} => {
  if (!employee || typeof employee !== 'object') {
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      pictureUrl: '',
      jobTitle: '',
      department: '',
      location: '',
      createdAt: '',
      updatedAt: ''
    };
  }

  const e = employee as Record<string, unknown>;
  return {
    id: safeGet(e.id, ''),
    firstName: safeGet(e.firstName, ''),
    lastName: safeGet(e.lastName, ''),
    email: safeGet(e.email, ''),
    phone: safeGet(e.phone, ''),
    pictureUrl: safeGet(e.pictureUrl, ''),
    jobTitle: safeGet(e.jobTitle, ''),
    department: safeGet(e.department, ''),
    location: safeGet(e.location, ''),
    createdAt: safeGet(e.createdAt, ''),
    updatedAt: safeGet(e.updatedAt, '')
  };
};