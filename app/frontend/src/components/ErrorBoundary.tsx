import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 56px)', padding: 16 }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, maxWidth: 560 }}>
            <h2 style={{ marginTop: 0 }}>Something went wrong.</h2>
            <p style={{ color: '#b3b3b3' }}>Try refreshing the page or returning to the home screen.</p>
            <a href="/" style={{ color: '#eab308' }}>Go home</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}


