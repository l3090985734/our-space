import { Component, type ReactNode } from 'react'
import { Heart, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-sakura-light to-white flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="inline-block mb-6">
              <Heart className="w-16 h-16 text-sakura-accent animate-pulse" />
            </div>
            <h1 className="text-xl font-semibold text-gray-700 mb-2">
              好像出了点问题
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              别担心，刷新一下试试看？
              <br />
              如果还不行，可能是网络不太好 💗
            </p>
            <button
              onClick={this.handleRefresh}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-md transition-shadow"
            >
              <RefreshCw className="w-4 h-4" />
              刷新页面
            </button>
            {this.state.error && (
              <p className="mt-4 text-xs text-gray-400 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
