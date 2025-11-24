import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, ArrowRight, Home, RefreshCw } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackPageProps {
  type: FeedbackType;
  title: string;
  message: string;
  details?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showHomeButton?: boolean;
  onHome?: () => void;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({
  type,
  title,
  message,
  details,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showHomeButton = true,
  onHome
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-20 h-20 text-green-500" />;
      case 'error':
        return <XCircle className="w-20 h-20 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-20 h-20 text-yellow-500" />;
      case 'info':
        return <Info className="w-20 h-20 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'from-green-50 to-emerald-50';
      case 'error':
        return 'from-red-50 to-rose-50';
      case 'warning':
        return 'from-yellow-50 to-amber-50';
      case 'info':
        return 'from-blue-50 to-indigo-50';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-yellow-200';
      case 'info':
        return 'border-blue-200';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBgColor()} flex items-center justify-center p-4`}>
      <div className={`max-w-md w-full bg-white rounded-3xl shadow-2xl border-2 ${getBorderColor()} p-8 animate-fade-in`}>
        {/* Ícone */}
        <div className="flex justify-center mb-6">
          {getIcon()}
        </div>

        {/* Título */}
        <h1 className="text-3xl font-black text-center text-slate-900 mb-4">
          {title}
        </h1>

        {/* Mensagem */}
        <p className="text-lg text-center text-slate-700 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Detalhes (se houver) */}
        {details && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {details}
            </p>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex flex-col gap-3">
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className={`w-full px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                type === 'success'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : type === 'error'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                  : type === 'warning'
                  ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {actionLabel}
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="w-full px-6 py-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                {secondaryActionLabel}
              </div>
            </button>
          )}

          {showHomeButton && onHome && (
            <button
              onClick={onHome}
              className="w-full px-6 py-4 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Voltar ao Início
              </div>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FeedbackPage;

