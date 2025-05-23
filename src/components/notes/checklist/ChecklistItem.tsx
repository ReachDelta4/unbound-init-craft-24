
import React, { useState, useRef, useEffect } from "react";
import { Trash2, MoreHorizontal, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChecklistItem as ChecklistItemType } from "./types";

interface ChecklistItemProps {
  item: ChecklistItemType;
  childItems: ChecklistItemType[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onToggleOpen: (id: string) => void;
  onAddItem: (parentId?: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem?: (id: string, direction: "up" | "down") => void;
  onStartEditing: (id: string) => void;
  onSaveLabel: (id: string, label: string) => void;
  level?: number;
  allItems?: ChecklistItemType[]; 
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
  allItems = []
}: ChecklistItemProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(item.isEditing || false);
  const [editedLabel, setEditedLabel] = useState(item.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Effect to focus input when editing starts
  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingLabel]);

  // Effect to update editing state when item prop changes
  useEffect(() => {
    if (item.isEditing) {
      setIsEditingLabel(true);
    }
  }, [item.isEditing]);

  // Handle saving the label
  const handleSaveLabel = () => {
    if (editedLabel.trim()) {
      onSaveLabel(item.id, editedLabel);
    }
    setIsEditingLabel(false);
  };

  // Handle key down events for the input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSaveLabel();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setEditedLabel(item.label); // Reset to original
      setIsEditingLabel(false);
    }
  };

  // Handle clicking on the label area (but not the checkbox)
  const handleLabelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditingLabel) {
      onStartEditing(item.id);
      setIsEditingLabel(true);
    }
  };

  // Handle checkbox change separately to prevent propagation
  const handleCheckboxChange = (checked: boolean) => {
    onToggleComplete(item.id, checked);
  };

  // Handle adding a subtask
  const handleAddSubtask = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddItem(item.id);
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleOpen(item.id);
              }}
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
            checked={item.completed}
            onCheckedChange={handleCheckboxChange}
            className="mt-0.5"
          />
        </div>

        {/* Label or input for editing */}
        <div className="flex-grow">
          {isEditingLabel ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={handleKeyDown}
                className="h-7 py-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <div
              className={cn(
                "cursor-text rounded py-0.5 px-1 -ml-1 hover:bg-secondary transition-colors",
                item.completed && "line-through text-muted-foreground"
              )}
              onClick={handleLabelClick}
            >
              {item.label}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add subtask button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleAddSubtask}
            title="Add subtask"
          >
            <Plus className="h-3.5 w-3.5" />
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
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onMoveItem(item.id, "up");
                  }}>
                    Move up
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onMoveItem(item.id, "down");
                  }}>
                    Move down
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }} 
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Render children recursively if they exist and the item is open */}
      {hasChildren && item.isOpen && (
        <div className="mt-1">
          {childItems.map(childItem => (
            <ChecklistItem
              key={childItem.id}
              item={childItem}
              childItems={allItems.filter(item => item.parentId === childItem.id)}
              onToggleComplete={onToggleComplete}
              onToggleOpen={onToggleOpen}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
              onMoveItem={onMoveItem}
              onStartEditing={onStartEditing}
              onSaveLabel={onSaveLabel}
              level={level + 1}
              allItems={allItems}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistItem;
