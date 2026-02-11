import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches React render errors so the app doesn't white-screen or crash (e.g. on Android).
 * Renders a simple recovery UI and logs the error.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-dark text-white font-display">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">warning</span>
          <h1 className="text-xl font-black uppercase tracking-wider mb-2">Something went wrong</h1>
          <p className="text-white/60 text-sm text-center mb-6 max-w-sm">
            Di app hit a bump. Tap below fi try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-3 rounded-2xl bg-primary text-background-dark font-black text-sm uppercase"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
