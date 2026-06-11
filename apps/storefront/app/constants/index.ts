/**
 * Application Constants
 */

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ['en', 'bn', 'de'] as const;

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = 'en' as const;

/**
 * Theme storage key
 */
export const THEME_STORAGE_KEY = 'app_theme';

/**
 * Language storage key
 */
export const LANGUAGE_STORAGE_KEY = 'app_language';

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
} as const;

const API = '/api';
const INVOICES = '/invoices';

/**
 * API endpoints — routed through Kong gateway with /api prefix
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API}/identity/login`,
    REGISTER: `${API}/identity/register`,
  },
  USERS: {
    GET_ALL: `${API}/identity/users`,
    GET_BY_ID: (id: string) => `${API}/identity/users/${id}`,
  },
  ORDERS: {
    LIST: `${API}/orders`,
    DETAIL: (id: string) => `${API}/orders/${id}`,
    CREATE: `${API}/orders`,
    CANCEL: (id: string) => `${API}/orders/${id}`,
    SAGA: (id: string) => `${API}/orders/${id}/saga`,
  },
  PAYMENTS: {
    LIST: `${API}/payments`,
    DETAIL: (id: string) => `${API}/payments/${id}`,
    REFUND: (id: string) => `${API}/payments/${id}/refund`,
  },
  INVENTORY: {
    LIST: `${API}/inventory/active-products`,
    OFFERS: `${API}/inventory/offer`,
    STOCK_OUT: `${API}/inventory/stock-out`,
    DETAIL: (id: string) => `${API}/inventory/active-products/${id}`,
  },
  CART: {
    GET: (userId: string) => `${API}/cart/${userId}`,
    ADD_ITEM: (userId: string) => `${API}/cart/${userId}/items`,
    CLEAR: (userId: string) => `${API}/cart/${userId}`,
    CHECKOUT: (userId: string) => `${API}/cart/${userId}/checkout`,
  },
  PDF: {
    GENERATE_INVOICE: `${API}/pdf/generate/invoice`,
  },
  INVOICES: {
    DOWNLOAD: (orderId: string) => `${INVOICES}/invoice_${orderId}.pdf`,
  },
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Breakpoint values (matches design tokens)
 */
export const BREAKPOINTS = {
  XS: 480,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
} as const;

/**
 * Form validation rules
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: THEME_STORAGE_KEY,
  LANGUAGE: LANGUAGE_STORAGE_KEY,
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
} as const;

/**
 * Cookie names
 */
export const COOKIES = {
  THEME: 'theme',
  LANGUAGE: 'language',
  AUTH_TOKEN: 'auth_token',
} as const;
