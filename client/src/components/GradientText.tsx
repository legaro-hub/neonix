import type { ReactNode } from 'react';

export function GradientText({
  children,
  className = '',
  variant = 'lime',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'lime' | 'rainbow' | 'aurora' | 'neon';
}) {
  const gradients: Record<string, string> = {
    lime: 'linear-gradient(135deg, #d4ff3a, #94b81f, #d4ff3a)',
    rainbow: 'linear-gradient(90deg, #d4ff3a, #00e5ff, #8b5cf6, #f472b6, #d4ff3a)',
    aurora: 'linear-gradient(135deg, #00e5ff, #8b5cf6, #d4ff3a, #00e5ff)',
    neon: 'linear-gradient(90deg, #d4ff3a, #00e5ff)',
  };

  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: gradients[variant],
        backgroundSize: variant === 'rainbow' ? '300% 100%' : '100% 100%',
        animation: variant === 'rainbow' ? 'gradient-flow 4s linear infinite' : undefined,
      }}
    >
      {children}
    </span>
  );
}
