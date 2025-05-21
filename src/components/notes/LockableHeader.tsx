
import React from "react";
import { Lock, Unlock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LockableHeaderProps {
  title: string;
  isLocked: boolean;
  onToggleLock: () => void;
  onAddItem?: () => void;
  showAddButton?: boolean;
}

const LockableHeader = ({
  title,
  isLocked,
  onToggleLock,
  onAddItem,
  showAddButton = false
}: LockableHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex items-center gap-1">
        {showAddButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAddItem} 
            title="Add item"
            disabled={isLocked}
          >
            <Plus size={16} />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleLock}
          title={isLocked ? "Unlock section" : "Lock section"}
        >
          {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
        </Button>
      </div>
    </div>
  );
};

export default LockableHeader;
