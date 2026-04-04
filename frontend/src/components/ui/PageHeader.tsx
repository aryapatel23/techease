import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-6">
      <div className="relative min-w-0">
        <span className="mb-3 inline-flex h-1.5 w-16 rounded-full bg-brand-500" />
        <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end md:pb-1">{actions}</div> : null}
    </div>
  );
};

export default PageHeader;
