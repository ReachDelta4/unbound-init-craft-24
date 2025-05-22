
import React from "react";
import { Lock, Unlock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

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
        <Toggle 
          pressed={isLocked}
          onPressedChange={onToggleLock}
          title={isLocked ? "Unlock section" : "Lock section"}
          className="h-8 w-8 p-0 data-[state=on]:bg-muted data-[state=on]:text-muted-foreground"
          aria-label={isLocked ? "Unlock section" : "Lock section"}
        >
          <div className={cn("transition-transform duration-300", isLocked ? "" : "rotate-12")}>
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </div>
        </Toggle>
      </div>
    </div>
  );
};

export default LockableHeader;
