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
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" />
        <span className="text-sm font-medium tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export default LoadingState;
