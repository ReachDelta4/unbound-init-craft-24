import React, { useState, useRef, useEffect } from "react";
import { X, MessageSquare, SendHorizontal, AlertCircle, PlusSquare, PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useGeminiChat } from "@/hooks/useGeminiChat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ChatHistory from './ChatHistory';
import { cn } from "@/lib/utils";

/**
 * A global, collapsible chat drawer for interacting with Unbound AI.
 * It is fixed to the bottom-right of the screen and can be expanded or collapsed.
 * The chat state is managed by the `useGeminiChat` hook, ensuring it has its own
 * isolated and stateful conversation session.
 */
const UnboundAIChat = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  
  const { 
    messages, 
    history,
    activeChatId,
    sendMessage, 
    isLoading, 
    error, 
    isClientAvailable, 
    startNewChat,
    switchChat,
    deleteChat
  } = useGeminiChat();
  
  useEffect(() => {
    if (isExpanded) {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
      if (!isLoading) {
        inputRef.current?.focus();
      }
    }
  }, [isExpanded, isLoading, messages]);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };
  
  const handleStartNewChat = () => {
    startNewChat();
    // Keep history panel open on small screens if it was already open
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isClientAvailable) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const renderChatMessages = () => {
    // Show a welcome message if there are no messages in the active chat
    if (messages.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Start a conversation</h3>
          <p className="text-sm text-muted-foreground">Ask Unbound AI anything.</p>
        </div>
      );
    }
    
    return messages.map((message, index) => (
      <div
        key={index}
        className={`mb-3 p-2 rounded-lg ${
          message.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    ));
  };

  const renderApiKeyError = () => {
    if (!isClientAvailable) {
      return (
        <Alert className="mb-4 bg-destructive/10 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unbound AI is not available. Please contact support.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out`}
    >
      {isExpanded ? (
        <div className={cn(
          "bg-card border border-border rounded-lg shadow-lg flex",
          "transition-all duration-300 ease-in-out",
          isHistoryPanelOpen ? "w-[600px] h-[500px]" : "w-96 h-[500px]"
        )}>
          {/* History Panel */}
          {isHistoryPanelOpen && (
            <div className="w-56 border-r flex flex-col">
              <div className="p-2 flex justify-between items-center border-b">
                <h3 className="text-sm font-medium pl-2">Chat History</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsHistoryPanelOpen(false)}>
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
              <ChatHistory 
                history={history}
                activeChatId={activeChatId}
                onSwitchChat={switchChat}
                onDeleteChat={deleteChat}
              />
            </div>
          )}

          {/* Main Chat Panel */}
          <div className="flex-1 flex flex-col">
            <div className="p-2 flex justify-between items-center border-b">
              {!isHistoryPanelOpen && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsHistoryPanelOpen(true)}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={handleStartNewChat}>
                <PlusSquare className="h-4 w-4" />
              </Button>
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
                    <div className="animate-pulse text-sm text-muted-foreground">Unbound AI is thinking...</div>
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
                  placeholder="Ask Unbound AI..."
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
        </div>
      ) : (
        <Button
          className="h-12 w-36 rounded-full shadow-lg"
          onClick={toggleExpanded}
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Chat with AI
        </Button>
      )}
    </div>
  );
};

export default UnboundAIChat; 