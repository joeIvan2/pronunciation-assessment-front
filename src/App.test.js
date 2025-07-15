import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom before any imports
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }) => <div data-testid="route">{element}</div>,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  NavLink: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

// Mock Firebase config to prevent errors during testing
jest.mock('./config/firebaseConfig', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Mock hooks to prevent API calls during testing
jest.mock('./hooks/useFirebaseAuth', () => ({
  __esModule: true,
  default: () => ({
    user: null,
    loading: false,
    error: null,
  }),
}));

// Mock all page components to prevent complex rendering
jest.mock('./pages/PronunciationAssessment', () => {
  return function MockPronunciationAssessment() {
    return <div data-testid="pronunciation-assessment">PronunciationAssessment</div>;
  };
});

jest.mock('./pages/Landing', () => {
  return function MockLanding() {
    return <div data-testid="landing">Landing</div>;
  };
});

jest.mock('./pages/PrivacyPolicyPage', () => {
  return function MockPrivacyPolicyPage() {
    return <div data-testid="privacy-policy">PrivacyPolicyPage</div>;
  };
});

jest.mock('./pages/DataDeletionPage', () => {
  return function MockDataDeletionPage() {
    return <div data-testid="data-deletion">DataDeletionPage</div>;
  };
});

jest.mock('./components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('./components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

jest.mock('./components/FirestoreErrorHandler', () => {
  return function MockFirestoreErrorHandler({ children }) {
    return <div data-testid="firestore-error-handler">{children}</div>;
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    
    // App should render without throwing any errors
    expect(document.body).toBeInTheDocument();
  });

  test('Jest and React Testing Library are working correctly', () => {
    // Simple test to verify setup
    const testElement = document.createElement('div');
    testElement.textContent = 'Test Element';
    document.body.appendChild(testElement);
    
    expect(testElement).toHaveTextContent('Test Element');
    expect(testElement).toBeInTheDocument();
    
    // Cleanup
    document.body.removeChild(testElement);
  });

  test('renders App component with error boundary', () => {
    render(<App />);
    
    // Test that the App component renders with ErrorBoundary
    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toBeInTheDocument();
  });
}); 