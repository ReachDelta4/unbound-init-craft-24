
import React from "react";
import { Progress } from "@/components/ui/progress";

interface ClientInterestBarProps {
  interestLevel: number;
}

const ClientInterestBar = ({ interestLevel }: ClientInterestBarProps) => {
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-foreground">Client Interest</h3>
        <span className="text-xs font-semibold text-primary">{interestLevel}%</span>
      </div>
      <Progress value={interestLevel} className="h-1.5" />
    </div>
  );
};

export default ClientInterestBar;
