import React, { type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Keeps unexpected rendering errors from turning the whole application white. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application rendering error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <section role="alert" className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-xl font-semibold text-amber-700">!</div>
            <h1 className="mt-4 text-lg font-semibold text-gray-900">Cette page n’a pas pu s’afficher</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">Vos données restent enregistrées. Rechargez l’application pour réessayer.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-teal-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Recharger l’application
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
