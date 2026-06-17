import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 10h18M8 2v4M16 2v4" />
  </svg>
);

export const BoltIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
  </svg>
);

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
  </svg>
);

export const LayersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 2 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const ChartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 3v18h18" />
    <path d="M7 14l3-4 4 3 5-6" />
  </svg>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const TgIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M21.9 4.3 2.6 11.6c-.9.4-.9 1.6.1 1.9l4.8 1.5 1.8 5.7c.3.8 1.3.9 1.8.2l2.5-3.2 4.9 3.6c.6.5 1.6.1 1.7-.7L22.9 5.4c.2-.9-.6-1.5-1-1.1Z" />
  </svg>
);

export const BoostyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M13.3 2.3a1 1 0 0 0-1.8 0l-1.4 3.5L6 7.8a1 1 0 0 0-.6.9l-.3 4.4 3.3-2.2a1 1 0 0 1 1.2 0l3.6 2.4 3.6-2.4a1 1 0 0 1 1.2 0l3.3 2.2-.3-4.4a1 1 0 0 0-.6-.9l-4.1-2-1.4-3.5zM12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
  </svg>
);
