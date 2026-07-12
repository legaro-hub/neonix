export function GlowOrb({
  color = '#d4ff3a',
  size = 200,
  blur = 100,
  className = '',
  animate = true,
}: {
  color?: string;
  size?: number;
  blur?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${animate ? 'orb' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}20 0%, ${color}08 40%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
    />
  );
}
