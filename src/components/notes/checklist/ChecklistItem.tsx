
import React from "react";
import { MoreHorizontal, Plus, Trash2, ArrowDown, ArrowUp, ChevronRight, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChecklistItem as ChecklistItemType } from "./types";

interface ChecklistItemProps {
  item: ChecklistItemType;
  childItems: ChecklistItemType[];
  onToggleComplete: (id: number, completed: boolean) => void;
  onToggleOpen: (id: number) => void;
  onAddItem: (parentId?: number) => void;
  onDeleteItem: (id: number) => void;
  onMoveItem: (id: number, direction: "up" | "down") => void;
  onStartEditing: (id: number) => void;
  onSaveLabel: (id: number, label: string) => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  childItems,
  onToggleComplete,
  onToggleOpen,
  onAddItem,
  onDeleteItem,
  onMoveItem,
  onStartEditing,
  onSaveLabel
}) => {
  return (
    <div key={item.id} className="space-y-1">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id={`item-${item.id}`} 
          checked={item.completed} 
          onCheckedChange={(checked) => onToggleComplete(item.id, checked === true)}
          className="mt-0.5"
        />
        
        <Collapsible
          open={item.isOpen}
          onOpenChange={() => onToggleOpen(item.id)}
          className="flex-grow"
        >
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {item.isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            {item.isEditing ? (
              <Input 
                defaultValue={item.label}
                className="h-7 py-1 px-2 text-sm"
                onBlur={(e) => onSaveLabel(item.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSaveLabel(item.id, e.currentTarget.value);
                  }
                }}
                autoFocus
              />
            ) : (
              <span
                className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                onDoubleClick={() => onStartEditing(item.id)}
              >
                {item.label}
              </span>
            )}
          </div>
          
          <CollapsibleContent className="space-y-2 mt-1">
            {/* Render child items */}
            {childItems.map(childItem => (
              <div key={childItem.id} className="ml-6 flex items-start space-x-2">
                <Checkbox 
                  id={`item-${childItem.id}`} 
                  checked={childItem.completed} 
                  onCheckedChange={(checked) => onToggleComplete(childItem.id, checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-grow">
                  {childItem.isEditing ? (
                    <Input 
                      defaultValue={childItem.label}
                      className="h-7 py-1 px-2 text-sm"
                      onBlur={(e) => onSaveLabel(childItem.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSaveLabel(childItem.id, e.currentTarget.value);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`text-sm ${childItem.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                      onDoubleClick={() => onStartEditing(childItem.id)}
                    >
                      {childItem.label}
                    </span>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onMoveItem(childItem.id, "up")}>
                      <ArrowUp size={14} className="mr-2" /> Move Up
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveItem(childItem.id, "down")}>
                      <ArrowDown size={14} className="mr-2" /> Move Down
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteItem(childItem.id)}
                      className="text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
            {/* Add subtask button */}
            <div className="ml-6 flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => onAddItem(item.id)}
              >
                <Plus size={14} className="mr-1" /> Add subtask
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMoveItem(item.id, "up")}>
              <ArrowUp size={14} className="mr-2" /> Move Up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveItem(item.id, "down")}>
              <ArrowDown size={14} className="mr-2" /> Move Down
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteItem(item.id)}
              className="text-destructive"
            >
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChecklistItem;
