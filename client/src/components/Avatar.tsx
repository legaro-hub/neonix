import { useState } from 'react';

const COLORS = {
  telegram: 'bg-sky-500/20 text-sky-400',
  pinterest: 'bg-red-400/20 text-red-400',
  youtube: 'bg-red-500/20 text-red-400',
  instagram: 'bg-pink-400/20 text-pink-400',
  user: 'bg-graphite-800 text-graphite-300',
};

interface AvatarProps {
  name: string;
  platform?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ name, platform, src, size = 'md', className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const letter = (name || '?').charAt(0).toUpperCase();
  const colorClass = COLORS[platform as keyof typeof COLORS] ?? COLORS.user;
  const sizeClass = SIZE_MAP[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${colorClass} ${className}`}>
      {letter}
    </div>
  );
}
