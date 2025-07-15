// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Web Speech API for testing
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: class MockSpeechRecognition {
    start() {}
    stop() {}
    abort() {}
    addEventListener() {}
    removeEventListener() {}
  },
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: window.SpeechRecognition,
});

// Mock MediaRecorder API for testing
Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: class MockMediaRecorder {
    constructor() {
      this.state = 'inactive';
      this.ondataavailable = null;
      this.onstop = null;
    }
    start() {
      this.state = 'recording';
    }
    stop() {
      this.state = 'inactive';
      if (this.onstop) this.onstop();
    }
    addEventListener() {}
    removeEventListener() {}
  },
});

// Mock getUserMedia for testing
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
      }],
    }),
  },
});

// Suppress console warnings during tests
const originalConsoleWarn = console.warn;
beforeEach(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps') ||
      args[0].includes('componentWillMount')
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterEach(() => {
  console.warn = originalConsoleWarn;
}); 