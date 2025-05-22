
import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { useNotesState } from "@/hooks/use-notes-state";

interface MarkdownLine {
  id: string;
  rawContent: string;
  renderedContent: string;
  isEditing: boolean;
}

// Convert markdown to HTML for a single line
const renderMarkdownLine = (line: string): string => {
  let renderedLine = line;
  
  // Headers
  if (renderedLine.match(/^# (.*?)$/)) {
    renderedLine = renderedLine.replace(/^# (.*?)$/, '$1');
    return renderedLine;
  }
  if (renderedLine.match(/^## (.*?)$/)) {
    renderedLine = renderedLine.replace(/^## (.*?)$/, '$1');
    return renderedLine;
  }
  if (renderedLine.match(/^### (.*?)$/)) {
    renderedLine = renderedLine.replace(/^### (.*?)$/, '$1');
    return renderedLine;
  }
  
  // Bold
  renderedLine = renderedLine.replace(/\*\*(.*?)\*\*/g, '$1');
  renderedLine = renderedLine.replace(/__(.*?)__/g, '$1');
  
  // Italic
  renderedLine = renderedLine.replace(/\*(.*?)\*/g, '$1');
  renderedLine = renderedLine.replace(/_(.*?)_/g, '$1');
  
  // Lists
  if (renderedLine.match(/^- (.*?)$/)) {
    renderedLine = renderedLine.replace(/^- (.*?)$/, '• $1');
    return renderedLine;
  }
  
  // Numbered Lists
  if (renderedLine.match(/^\d+\. (.*?)$/)) {
    renderedLine = renderedLine.replace(/^\d+\. (.*?)$/, (match, content) => {
      const number = match.split('.')[0];
      return `${number}. ${content}`;
    });
    return renderedLine;
  }
  
  return renderedLine;
};

const MarkdownEditor = () => {
  const initialNotes = "# Meeting Notes\n\nKey points:\n- Client interested in our enterprise plan\n- Need to follow up with pricing details\n- Technical integration is a priority\n";
  
  const {
    saveNote,
    isNoteLocked,
    toggleNoteLock,
    notes,
    isLoading
  } = useNotesState();
  
  const isLocked = isNoteLocked('markdown');
  
  // Convert initial notes to markdown lines
  const createInitialMarkdownLines = (content: string) => {
    return content.split('\n').map((line, index) => ({
      id: `line-${index}`,
      rawContent: line,
      renderedContent: renderMarkdownLine(line),
      isEditing: false
    }));
  };

  const [markdownLines, setMarkdownLines] = useState<MarkdownLine[]>(createInitialMarkdownLines(initialNotes));
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const lineInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // Load notes from database if they exist
  useEffect(() => {
    if (!isLoading) {
      const markdownNote = notes.find(note => note.note_type === 'markdown');
      if (markdownNote && markdownNote.content?.raw) {
        setMarkdownLines(createInitialMarkdownLines(markdownNote.content.raw));
      }
    }
  }, [notes, isLoading]);

  // Save notes to database when they change
  useEffect(() => {
    const rawContent = markdownLines.map(line => line.rawContent).join('\n');
    if (rawContent) {
      saveNote('markdown', { raw: rawContent }, isLocked);
    }
  }, [markdownLines, isLocked, saveNote]);

  // Handle Markdown line editing
  const startEditingLine = (id: string) => {
    if (isLocked) return;
    
    setMarkdownLines(markdownLines.map(line => 
      line.id === id ? { ...line, isEditing: true } : line
    ));
    setActiveLineId(id);
    
    // Focus on the input element after a short delay to ensure it exists in the DOM
    setTimeout(() => {
      if (lineInputRefs.current[id]) {
        lineInputRefs.current[id]?.focus();
      }
    }, 10);
  };

  // Handle line input change
  const handleLineChange = (id: string, content: string) => {
    if (isLocked) return;
    
    setMarkdownLines(markdownLines.map(line => 
      line.id === id ? { ...line, rawContent: content } : line
    ));
  };

  // Handle finishing edit (on Enter or blur)
  const finishEditingLine = (id: string) => {
    if (isLocked) return;
    
    const updatedLines = markdownLines.map(line => 
      line.id === id ? { 
        ...line, 
        isEditing: false, 
        renderedContent: renderMarkdownLine(line.rawContent) 
      } : line
    );
    setMarkdownLines(updatedLines);
    setActiveLineId(null);
  };

  // Handle key press in markdown line input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string, index: number) => {
    if (isLocked) return;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      // Create a new line
      const newId = `line-${Date.now()}`;
      const newLine: MarkdownLine = {
        id: newId,
        rawContent: '',
        renderedContent: '',
        isEditing: true
      };
      
      const updatedLines = [...markdownLines];
      // First finish editing the current line
      updatedLines[index] = {
        ...updatedLines[index],
        isEditing: false,
        renderedContent: renderMarkdownLine(updatedLines[index].rawContent)
      };
      // Then insert the new line
      updatedLines.splice(index + 1, 0, newLine);
      
      setMarkdownLines(updatedLines);
      setActiveLineId(newId);
      
      // Focus on the new line
      setTimeout(() => {
        lineInputRefs.current[newId]?.focus();
      }, 10);
    } else if (e.key === 'Backspace' && markdownLines[index].rawContent === '' && markdownLines.length > 1) {
      // Delete empty line on backspace
      e.preventDefault();
      const updatedLines = markdownLines.filter((_, i) => i !== index);
      setMarkdownLines(updatedLines);
      
      // Focus on previous line
      if (index > 0) {
        const prevLineId = updatedLines[index - 1].id;
        startEditingLine(prevLineId);
      }
    } else if (e.key === 'ArrowUp' && index > 0) {
      // Navigate to the line above
      e.preventDefault();
      const prevLineId = markdownLines[index - 1].id;
      startEditingLine(prevLineId);
    } else if (e.key === 'ArrowDown' && index < markdownLines.length - 1) {
      // Navigate to the line below
      e.preventDefault();
      const nextLineId = markdownLines[index + 1].id;
      startEditingLine(nextLineId);
    }
  };

  // Get CSS class based on markdown content
  const getLineClass = (rawContent: string): string => {
    if (rawContent.match(/^# /)) {
      return "text-2xl font-bold my-2";
    } else if (rawContent.match(/^## /)) {
      return "text-xl font-bold my-1.5";
    } else if (rawContent.match(/^### /)) {
      return "text-lg font-bold my-1";
    } else if (rawContent.match(/^- /)) {
      return "ml-4";
    } else if (rawContent.match(/^\d+\. /)) {
      return "ml-4";
    }
    return "my-0.5";
  };

  const handleToggleLock = async () => {
    const newLockState = await toggleNoteLock('markdown');
    setIsLocked(newLockState);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleLock}
          title={isLocked ? "Unlock notes" : "Lock notes"}
        >
          {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
        </Button>
      </div>
      <div className="flex-1 p-4 bg-muted border border-input rounded-md overflow-auto">
        {markdownLines.map((line, index) => (
          <div key={line.id} className={getLineClass(line.rawContent)}>
            {(line.isEditing || line.id === activeLineId) && !isLocked ? (
              <Input
                ref={(el) => lineInputRefs.current[line.id] = el}
                value={line.rawContent}
                onChange={(e) => handleLineChange(line.id, e.target.value)}
                onBlur={() => finishEditingLine(line.id)}
                onKeyDown={(e) => handleKeyDown(e, line.id, index)}
                className="bg-transparent border-none h-auto py-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus={line.id === activeLineId}
              />
            ) : (
              <div 
                onClick={() => !isLocked && startEditingLine(line.id)}
                className={`min-h-[1.5rem] ${!isLocked ? "cursor-text" : ""}`}
              >
                {line.renderedContent || ' '}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarkdownEditor;
