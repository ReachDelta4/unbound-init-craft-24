
import React, { useState } from "react";
import { PlusCircle, ChevronDown, ChevronRight, Trash2, MoreHorizontal, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChecklistItemType } from "./types";

interface ChecklistItemProps {
  item: ChecklistItemType;
  childItems: ChecklistItemType[];
  onToggleComplete: (id: string) => void;
  onToggleOpen: (id: string) => void;
  onAddItem: (parentId?: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem?: (id: string, direction: "up" | "down") => void;
  onStartEditing: (id: string) => void;
  onSaveLabel: (id: string, label: string) => void;
  level?: number;
  disabled?: boolean;
}

const ChecklistItem = ({
  item,
  childItems,
  onToggleComplete,
  onToggleOpen,
  onAddItem,
  onDeleteItem,
  onMoveItem,
  onStartEditing,
  onSaveLabel,
  level = 0,
  disabled = false
}: ChecklistItemProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(item.isEditing || false);
  const [editedLabel, setEditedLabel] = useState(item.label);

  // Handle saving the label
  const handleSaveLabel = () => {
    onSaveLabel(item.id, editedLabel);
    setIsEditingLabel(false);
  };

  // Handle key down events for the input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveLabel();
    }
  };

  const hasChildren = childItems.length > 0;
  const indentClass = level === 0 ? "ml-0" : `ml-${Math.min(level * 4, 8)}`;

  return (
    <div className="relative">
      <div className={cn("flex items-start group", indentClass)}>
        {/* Toggle children visibility if there are children */}
        <div className="flex-shrink-0 w-5 mt-0.5">
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={() => !disabled && onToggleOpen(item.id)}
              disabled={disabled}
            >
              {item.isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>

        {/* Checkbox for completion */}
        <div className="mr-2 mt-0.5">
          <Checkbox
            checked={item.isComplete}
            onCheckedChange={() => !disabled && onToggleComplete(item.id)}
            disabled={disabled}
            className="mt-0.5"
          />
        </div>

        {/* Label or input for editing */}
        <div className="flex-grow">
          {isEditingLabel && !disabled ? (
            <div className="flex gap-2">
              <Input
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={handleKeyDown}
                className="h-7 py-1"
                autoFocus
              />
            </div>
          ) : (
            <div
              className={cn(
                "cursor-text rounded py-0.5 px-1 -ml-1 hover:bg-secondary transition-colors",
                item.isComplete && "line-through text-muted-foreground"
              )}
              onClick={() => !disabled && onStartEditing(item.id)}
            >
              {item.label}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!disabled && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onAddItem(item.id)}
                title="Add child item"
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="More options">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onMoveItem && (
                    <>
                      <DropdownMenuItem onClick={() => onMoveItem(item.id, "up")}>
                        Move up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMoveItem(item.id, "down")}>
                        Move down
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onDeleteItem(item.id)} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Render children recursively if they exist and the item is open */}
      {hasChildren && item.isOpen && (
        <div className="mt-1">
          {childItems.map(childItem => (
            <ChecklistItem
              key={childItem.id}
              item={childItem}
              childItems={[]} // We're not supporting nested children beyond one level for simplicity
              onToggleComplete={onToggleComplete}
              onToggleOpen={onToggleOpen}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
              onStartEditing={onStartEditing}
              onSaveLabel={onSaveLabel}
              level={level + 1}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistItem;
