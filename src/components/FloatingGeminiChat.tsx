
import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, MessageSquare, SendHorizontal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useGeminiChat, ChatMessage } from "@/hooks/useGeminiChat";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FloatingGeminiChat = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 140, y: window.innerHeight - 140 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [inputValue, setInputValue] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, sendMessage, isLoading, error, isClientAvailable } = useGeminiChat();
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current) {
      setIsDragging(true);
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && widgetRef.current) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - widgetRef.current.offsetWidth));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - widgetRef.current.offsetHeight));
        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isClientAvailable) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const renderChatMessages = () => {
    return messages.map((message, index) => (
      <div
        key={index}
        className={`mb-3 p-2 rounded-lg ${
          message.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"
        }`}
      >
        <p className="text-sm">{message.parts[0]?.text || ""}</p>
      </div>
    ));
  };

  const renderApiKeyError = () => {
    if (!isClientAvailable) {
      return (
        <Alert className="mb-4 bg-destructive/10 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gemini API key not found. Please check your .env.local file and make sure VITE_GEMINI_API_KEY is set.
            <div className="mt-2 text-xs">
              <strong>Debugging tips:</strong>
              <ul className="list-disc pl-4">
                <li>Create a .env.local file in the root directory</li>
                <li>Add VITE_GEMINI_API_KEY=your_api_key</li>
                <li>Restart the development server</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 transition-all duration-200 ease-in-out ${
        isExpanded ? "w-80 h-96 rounded-lg shadow-lg" : "w-12 h-12 rounded-full shadow-md"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
      }}
    >
      {isExpanded ? (
        <div className="flex flex-col h-full">
          <div
            className="p-2 cursor-move flex justify-between items-center border-b"
            onMouseDown={handleMouseDown}
          >
            <h3 className="text-sm font-medium">Gemini Chat</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleExpanded}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full pr-4" ref={scrollAreaRef as React.RefObject<HTMLDivElement>}>
              {renderApiKeyError()}
              {renderChatMessages()}
              {isLoading && (
                <div className="flex justify-center items-center py-2">
                  <div className="animate-pulse text-sm text-muted-foreground">Gemini is thinking...</div>
                </div>
              )}
              {error && (
                <Alert className="mb-4 bg-destructive/10 border-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </div>
          <form onSubmit={handleSubmit} className="p-2 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Gemini..."
                disabled={isLoading || !isClientAvailable}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputValue.trim() || !isClientAvailable}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-full rounded-full"
          onClick={toggleExpanded}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default FloatingGeminiChat;
