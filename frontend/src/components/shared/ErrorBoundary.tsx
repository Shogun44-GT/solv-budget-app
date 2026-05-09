import { Component, type ReactNode } from 'react'

interface Props  { children: ReactNode }
interface State  { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <p className="text-5xl mb-4">⚠️</p>
            <h2 className="text-xl font-bold mb-2">Une erreur est survenue</h2>
            <p className="text-sm text-gray-400 mb-6">
              {this.state.error?.message || "Erreur inattendue. Rechargez la page."}
            </p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold transition">
              🔄 Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
