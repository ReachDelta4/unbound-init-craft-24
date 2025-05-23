
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LockableHeaderProps {
  title: string;
  onAddItem?: () => void;
  showAddButton?: boolean;
}

const LockableHeader = ({
  title,
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
            onClick={(e) => {
              e.stopPropagation();
              if (onAddItem) onAddItem();
            }} 
            title="Add item"
          >
            <Plus size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default LockableHeader;
