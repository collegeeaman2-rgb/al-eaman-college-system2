import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  details: string | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '', details: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected error occurred.';
    let details: string | null = null;
    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
        path?: string;
      };
      if (parsed && parsed.error) {
        message = parsed.error;
        details = `Operation: ${parsed.operationType ?? 'unknown'} · Path: ${parsed.path ?? 'n/a'}`;
      }
    } catch {
      // Non-JSON error message
    }
    return { hasError: true, message, details };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F8FD] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-[#D7E5F5] rounded-2xl p-6 space-y-4 shadow-[0_12px_32px_-12px_rgba(21,62,117,0.12)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-[#172B45]">
                  Security or Data Access Interruption
                </h1>
                <p className="text-sm text-[#4B6484] mt-1 break-words">{this.state.message}</p>
                {this.state.details && (
                  <p className="text-xs font-mono text-[#667D9B] mt-2 break-all">
                    {this.state.details}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-3 border-t border-[#D7E5F5] flex justify-end">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[#2878D0] text-white hover:bg-[#1E63B3] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
