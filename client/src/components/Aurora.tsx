export function Aurora({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
    </div>
  );
}

export function AuroraHero() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="aurora-blob aurora-hero-1" />
      <div className="aurora-blob aurora-hero-2" />
      <div className="aurora-blob aurora-hero-3" />
      <div className="aurora-blob aurora-hero-4" />
    </div>
  );
}
