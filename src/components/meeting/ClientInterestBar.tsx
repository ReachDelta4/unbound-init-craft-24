import React from "react";

interface ClientInterestBarProps {
  interestLevel: number;
}

const ClientInterestBar = ({ interestLevel }: ClientInterestBarProps) => {
  // Calculate color based on interest level
  const getColor = () => {
    if (interestLevel >= 80) return "bg-green-500";
    if (interestLevel >= 60) return "bg-emerald-500";
    if (interestLevel >= 40) return "bg-amber-500";
    if (interestLevel >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium">Client Interest</span>
        <span className="text-xs font-mono">{interestLevel}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border">
        <div
          className={`h-full ${getColor()} rounded-full`}
          style={{ width: `${interestLevel}%` }}
        />
      </div>
    </div>
  );
};

export default ClientInterestBar;
