import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary
 * Catches JavaScript errors in child components (rendering phase)
 * and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in visualization:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-red-500/5 rounded-xl border border-red-500/20 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">Rendering Failed</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md leading-relaxed">
            {this.state.error?.message || "An unexpected error occurred while attempting to render this visualization."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-red-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Reset View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;