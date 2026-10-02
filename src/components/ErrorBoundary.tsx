import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center gap-3 text-amber-400">
              <span className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-8 h-8" />
              </span>
              <div>
                <h1 className="text-lg font-black text-white">PHÚC NGUYÊN M&amp;E</h1>
                <p className="text-xs text-amber-300 font-semibold">Phát hiện sự cố hiển thị (Đã được chặn an toàn)</p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 text-xs space-y-2">
              <div className="text-slate-400 font-semibold">Thông tin chi tiết lỗi:</div>
              <div className="font-mono text-rose-400 break-words text-[11px] bg-slate-950 p-2.5 rounded-lg border border-rose-900/30">
                {this.state.error?.message || 'Lỗi không xác định'}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dữ liệu của bạn trên Supabase vẫn an toàn. Vui lòng bấm <strong>Tải lại trang</strong> hoặc <strong>Khôi phục &amp; Xóa bộ nhớ đệm</strong> để ứng dụng tự làm mới dữ liệu sạch.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải Lại Trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Khôi Phục &amp; Xóa Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
