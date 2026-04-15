/**
 * ErrorBoundary — catches unhandled React render errors and shows a
 * clean recovery UI instead of a white screen.
 *
 * Usage (wrap any subtree):
 *   <ErrorBoundary>
 *     <ConsignmentWorkbench />
 *   </ErrorBoundary>
 *
 * With custom fallback:
 *   <ErrorBoundary fallback={<p>Something broke</p>}>
 *     ...
 *   </ErrorBoundary>
 */

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Called when the error boundary catches an error (for logging) */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev; wire to Sentry/Datadog in prod
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center
          rounded-lg border border-red-200 bg-red-50/30">
          <div className="p-3 rounded-full bg-white border border-red-100 shadow-sm">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-semibold text-foreground">
              Something went wrong
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {this.state.error?.message
                ? `Error: ${this.state.error.message}`
                : "An unexpected error occurred in this section."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleReset}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for convenience — wraps children in ErrorBoundary.
 */
export function withErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
