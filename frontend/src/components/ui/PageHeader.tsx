import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-white to-teal-50/60 px-5 py-5 md:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="section-chip">Workspace</span>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
};

export default PageHeader;
