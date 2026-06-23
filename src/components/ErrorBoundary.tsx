import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faHouse, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { SEO } from './SEO';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-white select-none">
          <SEO title="Something went wrong" />
          <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mb-8">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-[#0F0A1E] mb-4 text-center">We hit a roadblock</h1>
          <p className="text-neutral-500 text-center max-w-md mb-8">
            The page you're trying to view encountered an unexpected error.
            {this.state.error && (
              <span className="block mt-2 text-xs font-mono bg-neutral-100 text-neutral-600 p-2 rounded-lg truncate">
                {this.state.error.message}
              </span>
            )}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                (this as any).setState({ hasError: false, error: null });
              }}
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => {
                (this as any).setState({ hasError: false, error: null });
                (this as any).props.onReset();
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faHouse} className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
