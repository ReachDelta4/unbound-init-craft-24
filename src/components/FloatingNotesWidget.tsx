
import React, { useState, useCallback } from 'react';
import { StickyNote, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface FloatingNotesWidgetProps {
  isCallActive?: boolean;
}

const FloatingNotesWidget = ({ isCallActive = false }: FloatingNotesWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState('');

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
  }, []);

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {isExpanded ? (
        <div className="bg-card border border-border rounded-lg shadow-lg p-4 w-80 max-h-96">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Quick Notes</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleExpanded}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add your notes here..."
            className="min-h-[200px] resize-none"
          />
        </div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={toggleExpanded}
        >
          <StickyNote className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default FloatingNotesWidget;
