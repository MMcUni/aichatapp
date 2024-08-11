import '@testing-library/jest-dom';

// Mock IntersectionObserver if it's not available in the test environment
if (typeof IntersectionObserver === 'undefined') {
  class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.IntersectionObserver = IntersectionObserver;
}