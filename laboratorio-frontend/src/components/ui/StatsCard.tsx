// src/components/ui/StatsCard.tsx
import { CustomCard } from './CustomCard';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  trend?: string;
  onClick?: () => void;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend, 
  onClick 
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
  };

  const trendColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-200
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer transform hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trendColorClasses[color]}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          {icon}
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white opacity-10 transform translate-x-8 -translate-y-8"></div>
    </div>
  );
}