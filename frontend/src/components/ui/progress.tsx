import React from "react";

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: "default" | "primary" | "success" | "warning" | "danger";
}

const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className = "", 
  showLabel = false,
  color = "default"
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorClasses = {
    default: "bg-gray-600",
    primary: "bg-yellow-600",
    success: "bg-green-600",
    warning: "bg-orange-600",
    danger: "bg-red-600"
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-800 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-sm text-gray-400 mt-1">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export { Progress };
export type { ProgressProps }; 