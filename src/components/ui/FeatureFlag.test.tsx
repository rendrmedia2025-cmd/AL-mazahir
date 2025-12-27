/**
 * Feature Flag Components Unit Tests
 * Tests React components for feature flag functionality
 * Requirements: 9.1, 9.2
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FeatureFlag, FeatureFlagGate, withFeatureFlag } from './FeatureFlag';
import { FeatureFlagProvider } from './FeatureFlagProvider';

// Mock the feature flags service
const mockFeatureFlags = {
  isEnabled: jest.fn(),
  getFlags: jest.fn(),
  clearCache: jest.fn()
};

jest.mock('@/lib/feature-flags', () => ({
  featureFlags: mockFeatureFlags
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FeatureFlagProvider initialFlags={['test-flag', 'another-flag']}>
    {children}
  </FeatureFlagProvider>
);

describe('FeatureFlag Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when flag is enabled', async () => {
    mockFeatureFlags.isEnabled.mockResolvedValue(true);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': true });

    render(
      <TestWrapper>
        <FeatureFlag flag="test-flag">
          <div>Feature content</div>
        </FeatureFlag>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Feature content')).toBeInTheDocument();
    });
  });

  it('should not render children when flag is disabled', async () => {
    mockFeatureFlags.isEnabled.mockResolvedValue(false);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': false });

    render(
      <TestWrapper>
        <FeatureFlag flag="test-flag">
          <div>Feature content</div>
        </FeatureFlag>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Feature content')).not.toBeInTheDocument();
    });
  });

  it('should render fallback when flag is disabled', async () => {
    mockFeatureFlags.isEnabled.mockResolvedValue(false);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': false });

    render(
      <TestWrapper>
        <FeatureFlag flag="test-flag" fallback={<div>Fallback content</div>}>
          <div>Feature content</div>
        </FeatureFlag>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Fallback content')).toBeInTheDocument();
      expect(screen.queryByText('Feature content')).not.toBeInTheDocument();
    });
  });

  it('should render loading state while checking flag', async () => {
    mockFeatureFlags.isEnabled.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    mockFeatureFlags.getFlags.mockResolvedValue({});

    render(
      <TestWrapper>
        <FeatureFlag flag="test-flag" loading={<div>Loading...</div>}>
          <div>Feature content</div>
        </FeatureFlag>
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Feature content')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should pass context to flag evaluation', async () => {
    const context = { userId: 'user-123', isAdmin: true };
    mockFeatureFlags.isEnabled.mockResolvedValue(true);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': true });

    render(
      <TestWrapper>
        <FeatureFlag flag="test-flag" context={context}>
          <div>Feature content</div>
        </FeatureFlag>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith('test-flag', context);
    });
  });
});

describe('FeatureFlagGate Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when all flags are enabled (mode: all)', async () => {
    mockFeatureFlags.isEnabled
      .mockResolvedValueOnce(true)  // flag-1
      .mockResolvedValueOnce(true); // flag-2
    mockFeatureFlags.getFlags.mockResolvedValue({ 'flag-1': true, 'flag-2': true });

    render(
      <TestWrapper>
        <FeatureFlagGate flags={['flag-1', 'flag-2']} mode="all">
          <div>Gated content</div>
        </FeatureFlagGate>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Gated content')).toBeInTheDocument();
    });
  });

  it('should not render children when not all flags are enabled (mode: all)', async () => {
    mockFeatureFlags.isEnabled
      .mockResolvedValueOnce(true)   // flag-1
      .mockResolvedValueOnce(false); // flag-2
    mockFeatureFlags.getFlags.mockResolvedValue({ 'flag-1': true, 'flag-2': false });

    render(
      <TestWrapper>
        <FeatureFlagGate flags={['flag-1', 'flag-2']} mode="all">
          <div>Gated content</div>
        </FeatureFlagGate>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Gated content')).not.toBeInTheDocument();
    });
  });

  it('should render children when any flag is enabled (mode: any)', async () => {
    mockFeatureFlags.isEnabled
      .mockResolvedValueOnce(true)   // flag-1
      .mockResolvedValueOnce(false); // flag-2
    mockFeatureFlags.getFlags.mockResolvedValue({ 'flag-1': true, 'flag-2': false });

    render(
      <TestWrapper>
        <FeatureFlagGate flags={['flag-1', 'flag-2']} mode="any">
          <div>Gated content</div>
        </FeatureFlagGate>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Gated content')).toBeInTheDocument();
    });
  });

  it('should not render children when no flags are enabled (mode: any)', async () => {
    mockFeatureFlags.isEnabled
      .mockResolvedValueOnce(false) // flag-1
      .mockResolvedValueOnce(false); // flag-2
    mockFeatureFlags.getFlags.mockResolvedValue({ 'flag-1': false, 'flag-2': false });

    render(
      <TestWrapper>
        <FeatureFlagGate flags={['flag-1', 'flag-2']} mode="any">
          <div>Gated content</div>
        </FeatureFlagGate>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Gated content')).not.toBeInTheDocument();
    });
  });

  it('should render fallback when conditions are not met', async () => {
    mockFeatureFlags.isEnabled
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'flag-1': false, 'flag-2': false });

    render(
      <TestWrapper>
        <FeatureFlagGate 
          flags={['flag-1', 'flag-2']} 
          mode="any"
          fallback={<div>No access</div>}
        >
          <div>Gated content</div>
        </FeatureFlagGate>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No access')).toBeInTheDocument();
      expect(screen.queryByText('Gated content')).not.toBeInTheDocument();
    });
  });
});

describe('withFeatureFlag HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render wrapped component when flag is enabled', async () => {
    mockFeatureFlags.isEnabled.mockResolvedValue(true);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': true });

    const TestComponent: React.FC<{ message: string }> = ({ message }) => (
      <div>{message}</div>
    );

    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag');

    render(
      <TestWrapper>
        <WrappedComponent message="Hello World" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('should not render wrapped component when flag is disabled', async () => {
    mockFeatureFlags.isEnabled.mockResolvedValue(false);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': false });

    const TestComponent: React.FC<{ message: string }> = ({ message }) => (
      <div>{message}</div>
    );

    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag');

    render(
      <TestWrapper>
        <WrappedComponent message="Hello World" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
    });
  });

  it('should render fallback component when flag is disabled', async () => {
    mockFeatureFlags.isEnabled.mockResolvedValue(false);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': false });

    const TestComponent: React.FC<{ message: string }> = ({ message }) => (
      <div>{message}</div>
    );

    const FallbackComponent: React.FC<{ message: string }> = ({ message }) => (
      <div>Fallback: {message}</div>
    );

    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag', undefined, FallbackComponent);

    render(
      <TestWrapper>
        <WrappedComponent message="Hello World" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Fallback: Hello World')).toBeInTheDocument();
      expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
    });
  });

  it('should pass context to flag evaluation', async () => {
    const context = { userId: 'user-123' };
    mockFeatureFlags.isEnabled.mockResolvedValue(true);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': true });

    const TestComponent: React.FC<{ message: string }> = ({ message }) => (
      <div>{message}</div>
    );

    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag', context);

    render(
      <TestWrapper>
        <WrappedComponent message="Hello World" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith('test-flag', context);
    });
  });
});

describe('FeatureFlagProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load initial flags on mount', async () => {
    mockFeatureFlags.getFlags.mockResolvedValue({ 'flag-1': true, 'flag-2': false });

    render(
      <FeatureFlagProvider initialFlags={['flag-1', 'flag-2']}>
        <div>Test content</div>
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(mockFeatureFlags.getFlags).toHaveBeenCalledWith(['flag-1', 'flag-2']);
    });
  });

  it('should provide flag checking functionality to children', async () => {
    mockFeatureFlags.isEnabled.mockResolvedValue(true);
    mockFeatureFlags.getFlags.mockResolvedValue({ 'test-flag': true });

    const TestChild: React.FC = () => {
      const { checkFlag } = React.useContext(require('./FeatureFlagProvider').FeatureFlagContext);
      
      React.useEffect(() => {
        checkFlag('test-flag');
      }, [checkFlag]);

      return <div>Test child</div>;
    };

    render(
      <FeatureFlagProvider>
        <TestChild />
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith('test-flag', {});
    });
  });

  it('should clear cache when refreshFlags is called', async () => {
    mockFeatureFlags.getFlags.mockResolvedValue({});

    const TestChild: React.FC = () => {
      const { refreshFlags } = React.useContext(require('./FeatureFlagProvider').FeatureFlagContext);
      
      React.useEffect(() => {
        refreshFlags();
      }, [refreshFlags]);

      return <div>Test child</div>;
    };

    render(
      <FeatureFlagProvider>
        <TestChild />
      </FeatureFlagProvider>
    );

    await waitFor(() => {
      expect(mockFeatureFlags.clearCache).toHaveBeenCalled();
    });
  });
});