export const APP_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: 12,
  PAGE_SIZE_OPTIONS: [6, 12, 24, 48],
  
  // API
  STALE_TIME: 30000, // 30 seconds
  CACHE_TIME: 300000, // 5 minutes
  
  // Debounce
  SEARCH_DEBOUNCE_DELAY: 500,
  
  // UI
  CARD_ANIMATION_DURATION: 200,
  SKELETON_COUNT: 8,
} as const;

export const EMPLOYEE_SORT_OPTIONS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'department', label: 'Department' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'location', label: 'Location' },
  { value: 'createdAt', label: 'Date Added' },
] as const;

export const SORT_ORDERS = [
  { value: 'ASC', label: 'A → Z' },
  { value: 'DESC', label: 'Z → A' },
] as const;