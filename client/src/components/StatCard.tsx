interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: { value: number; label: string };
  color?: string;
}

export function StatCard({ label, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="card p-4 card-interactive">
      <div className="flex items-start justify-between mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        {trend && (
          <span className={`text-[10px] font-medium ${trend.value >= 0 ? 'text-lime' : 'text-red-400'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${color || 'text-graphite-100'}`}>{value}</div>
      <div className="text-xs text-graphite-500 mt-0.5">{label}</div>
    </div>
  );
}
