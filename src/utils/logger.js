// src/utils/logger.js

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// You can set this to true in your .env file to enable logging in production if needed
const ENABLE_PRODUCTION_LOGS = import.meta.env.VITE_ENABLE_PRODUCTION_LOGS === 'true';

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