// --- File: src/components/AnalyticsCharts.js ---
import React from 'react';

/**
 * 簡易長條圖組件
 */
export const BarChart = ({ data, title, xKey, yKey, color = "bg-blue-500" }) => {
  const maxValue = Math.max(...data.map(item => parseFloat(item[yKey])));
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-2">
        {data.slice(0, 10).map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm truncate pr-2">
              {item[xKey]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div 
                className={`${color} h-6 rounded-full transition-all duration-300`}
                style={{ width: `${(parseFloat(item[yKey]) / maxValue) * 100}%` }}
              />
              <span className="absolute right-2 top-0 h-6 flex items-center text-xs text-gray-700">
                {item[yKey]}{yKey.includes('Rate') ? '%' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 簡易圓餅圖組件
 */
export const PieChart = ({ data, title, colors = [] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const defaultColors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex flex-col space-y-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          const colorClass = colors[index] || defaultColors[index % defaultColors.length];
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 ${colorClass} rounded`}></div>
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="text-sm font-medium">
                {item.value} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 統計卡片組件
 */
export const StatsCard = ({ title, value, subtitle, color = "blue" }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className={`${colorClasses[color]} p-4 rounded-lg`}>
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
    </div>
  );
};
