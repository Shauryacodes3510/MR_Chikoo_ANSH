import React, { ErrorInfo, ReactNode } from 'react';
import ErrorView from './ui/ErrorView';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Avoid logging objects that might contain cross-origin frame references
    console.error('=== CHIKOO_RUNTIME_ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Location:', window.location.href);
    console.error('Time:', performance.now());
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorView
          title="Chikoo failed to Load!"
          error={this.state.error}
          onRetry={this.handleReset}
          isFullScreen={true}
        />
      );
    }

    return this.props.children;
  }
}
