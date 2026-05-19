import { Component } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info)
    }
  }

  render() {
    if (this.state.error) {
      return <ErrorPage error={this.state.error} onReset={() => this.setState({ error: null, info: null })} />
    }
    return this.props.children
  }
}

function ErrorPage({ error, onReset }) {
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-[21px] py-[55px]">
      <div className="w-full max-w-[420px] text-center">
        <div className="w-[72px] h-[72px] rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-[16px]">
          <AlertTriangle size={34} className="text-red-600" />
        </div>
        <h1 className="text-[26px] font-bold text-primary mb-[8px]">Terjadi Kesalahan</h1>
        <p className="text-[14px] text-secondary mb-[21px] leading-relaxed">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
        </p>

        {isDev && error && (
          <div className="mb-[21px] p-[16px] rounded-[10px] bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-left">
            <p className="text-[11px] text-red-700 dark:text-red-400 font-mono break-all leading-relaxed">
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <details className="mt-[8px]">
                <summary className="text-[11px] text-red-600 cursor-pointer hover:text-red-700">Stack Trace</summary>
                <pre className="mt-[6px] text-[10px] text-red-600/80 font-mono whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {!isDev && (
          <div className="mb-[21px] p-[16px] rounded-[10px] bg-surface-secondary border border-subtle">
            <p className="text-[12px] text-secondary leading-relaxed">
              Kemungkinan penyebab: koneksi terputus, server sibuk, atau terjadi kesalahan pada aplikasi.
            </p>
          </div>
        )}

        <div className="flex gap-[10px] justify-center">
          <button onClick={onReset} className="btn-primary inline-flex">
            <RefreshCw size={16} />
            Muat Ulang
          </button>
          <Link to="/" onClick={onReset} className="btn-secondary inline-flex">
            <Home size={16} />
            Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}

export { ErrorPage }
