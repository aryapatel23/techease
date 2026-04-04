import React from 'react';

interface LoadingStateProps {
  message?: string;
  compact?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  compact = false
}) => {
  return (
    <div className={`flex items-center justify-center ${compact ? 'py-6' : 'h-64'}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft text-slate-600">
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-200 opacity-70" />
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        </span>
        <span className="text-sm font-medium tracking-tight">{message}</span>
      </div>
    </div>
  );
};

export default LoadingState;
