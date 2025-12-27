// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    // Immediately trigger intersection for tests
    this.triggerIntersection();
  }
  
  triggerIntersection() {
    // Use setTimeout to ensure it happens after component mount
    setTimeout(() => {
      if (this.callback) {
        this.callback([{ isIntersecting: true }]);
      }
    }, 0);
  }
  
  observe() {
    // Trigger intersection when observe is called
    this.triggerIntersection();
    return null;
  }
  
  disconnect() {
    return null;
  }
  
  unobserve() {
    return null;
  }
};

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo for navigation tests
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock Element.scrollIntoView for navigation tests
Element.prototype.scrollIntoView = jest.fn();