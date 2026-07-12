import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`card p-12 text-center ${className}`}>
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h2 className="font-display text-xl font-bold text-white mb-2">{title}</h2>
      {description && <p className="text-sm text-graphite-400 mb-6 max-w-md mx-auto">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
