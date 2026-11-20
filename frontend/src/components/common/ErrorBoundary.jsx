import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/internal/dasbor';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
          <div className="max-w-lg w-full bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[18px] bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#004582] tracking-tight">
                  Terjadi Kendala Tampilan
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Sistem mendeteksi kesalahan rendering pada halaman ini.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-[20px] bg-slate-50 border border-slate-200/60 font-mono text-xs text-rose-600 overflow-x-auto max-h-40">
                <p className="font-bold">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[24px] bg-[#DE0E86] text-white text-xs font-bold hover:opacity-95 active:scale-[0.98] transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[24px] bg-[#004582] text-white text-xs font-bold hover:opacity-95 active:scale-[0.98] transition-all shadow-md"
              >
                <Home className="w-4 h-4" />
                <span>Ke Dasbor</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
