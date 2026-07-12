export function Aurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-15"
        style={{ background: 'linear-gradient(135deg, #d4ff3a, #94b81f)', filter: 'blur(120px)', animation: 'aurora-drift 20s ease-in-out infinite' }} />
      <div className="absolute top-[30%] -right-[15%] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: 'linear-gradient(135deg, #00e5ff, #0097a7)', filter: 'blur(120px)', animation: 'aurora-drift 25s ease-in-out infinite reverse' }} />
      <div className="absolute -bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', filter: 'blur(120px)', animation: 'aurora-drift 22s ease-in-out infinite', animationDelay: '-7s' }} />
    </div>
  );
}

export function AuroraHero() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,255,58,0.12) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'aurora-drift 25s ease-in-out infinite' }} />
      <div className="absolute top-[10%] -right-[10%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'aurora-drift 30s ease-in-out infinite reverse' }} />
      <div className="absolute bottom-0 -left-[5%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'aurora-drift 22s ease-in-out infinite', animationDelay: '-5s' }} />
    </div>
  );
}
