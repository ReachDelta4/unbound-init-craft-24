
import React, { useState, useRef, useCallback } from "react";
import { X, StickyNote } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChecklistPanel from "./notes/ChecklistPanel";
import QuestionsPanel from "./notes/QuestionsPanel";
import MarkdownEditor from "./notes/MarkdownEditor";

interface FloatingNotesWidgetProps {
  isCallActive: boolean;
}

const FloatingNotesWidget = ({ isCallActive }: FloatingNotesWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 140, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    
    // Prevent text selection during drag
    e.preventDefault();
    
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Prevent text selection during drag
    e.preventDefault();
    
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;
    
    // Constraint to viewport - ensure the widget stays within screen bounds
    const widgetWidth = isExpanded ? 300 : 120;
    const widgetHeight = isExpanded ? 400 : 40;
    const maxX = window.innerWidth - widgetWidth;
    const maxY = window.innerHeight - widgetHeight;
    
    // Keep widget within bounds
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, isExpanded]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      // Disable text selection on the entire document during drag
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      // Re-enable text selection when not dragging
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Ensure text selection is re-enabled on cleanup
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleToggleExpanded = () => {
    if (!isDragging) {
      // Adjust position when expanding to ensure it stays in bounds
      if (!isExpanded) {
        const widgetWidth = 300;
        const widgetHeight = 400;
        const maxX = window.innerWidth - widgetWidth;
        const maxY = window.innerHeight - widgetHeight;
        
        setPosition(prev => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY)
        }));
      }
      setIsExpanded(!isExpanded);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Floating Widget - removed backdrop */}
      <div
        ref={widgetRef}
        className={`fixed z-50 transition-all duration-300 ease-out ${
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        } ${isExpanded ? 'cursor-default' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          width: isExpanded ? '300px' : '120px',
          height: isExpanded ? '400px' : '40px',
          userSelect: isDragging ? 'none' : 'auto'
        }}
        onMouseDown={!isExpanded ? handleMouseDown : undefined}
      >
        {!isExpanded ? (
          // Collapsed State
          <div
            className="bg-card/90 backdrop-blur-sm border-2 border-border rounded-[20px] h-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 hover:bg-card/95"
            onClick={handleToggleExpanded}
          >
            <StickyNote size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Notes</span>
          </div>
        ) : (
          // Expanded State
          <div className="bg-card/95 backdrop-blur-sm border-2 border-border rounded-xl shadow-2xl h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div 
              className={`flex items-center justify-between p-3 border-b-2 border-border ${
                isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
              }`}
              onMouseDown={handleMouseDown}
              style={{ userSelect: 'none' }}
            >
              <h3 className="text-sm font-medium">Notes & Agenda</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-muted/80"
                onClick={handleClose}
              >
                <X size={14} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="checklist" className="w-full h-full flex flex-col">
                <div className="px-3 pt-2">
                  <TabsList className="grid w-full grid-cols-2 h-8 border border-border">
                    <TabsTrigger value="checklist" className="text-xs">
                      ✅ Checklist
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs">
                      📝 Notes
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 px-3 pb-3">
                  <TabsContent value="checklist" className="mt-3 space-y-3">
                    <ChecklistPanel />
                    <QuestionsPanel />
                  </TabsContent>

                  <TabsContent value="notes" className="mt-3 h-full">
                    <div className="h-[280px]">
                      <MarkdownEditor />
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingNotesWidget;
