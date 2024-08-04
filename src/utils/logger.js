let isProduction, isDevelopment, ENABLE_PRODUCTION_LOGS;

if (typeof process !== 'undefined' && process.env) {
  // Node.js environment
  isProduction = process.env.NODE_ENV === 'production';
  isDevelopment = process.env.NODE_ENV === 'development';
  ENABLE_PRODUCTION_LOGS = process.env.ENABLE_PRODUCTION_LOGS === 'true';
} else if (typeof import.meta !== 'undefined' && import.meta.env) {
  // Vite/browser environment
  isProduction = import.meta.env.PROD;
  isDevelopment = import.meta.env.DEV;
  ENABLE_PRODUCTION_LOGS = import.meta.env.VITE_ENABLE_PRODUCTION_LOGS === 'true';
} else {
  // Fallback
  isProduction = false;
  isDevelopment = true;
  ENABLE_PRODUCTION_LOGS = false;
}

export const log = (...args) => {
  if (isDevelopment || (isProduction && ENABLE_PRODUCTION_LOGS)) {
    console.log(...args);
  }
};

export const error = (...args) => {
  if (isDevelopment || (isProduction && ENABLE_PRODUCTION_LOGS)) {
    console.error(...args);
  }
};

export const warn = (...args) => {
  if (isDevelopment || (isProduction && ENABLE_PRODUCTION_LOGS)) {
    console.warn(...args);
  }
};

export const info = (...args) => {
  if (isDevelopment || (isProduction && ENABLE_PRODUCTION_LOGS)) {
    console.info(...args);
  }
};