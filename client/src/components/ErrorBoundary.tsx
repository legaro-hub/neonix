import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-graphite-950 p-5">
          <div className="card max-w-md p-8 text-center">
            <div className="text-5xl mb-4">💥</div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Что-то пошло не так</h1>
            <p className="text-sm text-graphite-300 mb-6">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </p>
            {this.state.error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleReset} className="btn-primary">
                Попробовать снова
              </button>
              <button onClick={() => window.location.href = '/'} className="btn-ghost">
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
