import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="card card-hover px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
