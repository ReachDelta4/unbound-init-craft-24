import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2 } from 'lucide-react';
import { StoredChat } from './chatHistoryManager';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ChatHistoryProps {
  history: StoredChat[];
  activeChatId: string | null;
  onSwitchChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ history, activeChatId, onSwitchChat, onDeleteChat }) => {
  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No chat history yet.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {history.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "flex items-center justify-between p-2 rounded-md cursor-pointer group",
              activeChatId === chat.id 
                ? "bg-primary/10" 
                : "hover:bg-muted/50"
            )}
            onClick={() => onSwitchChat(chat.id)}
          >
            <div className="flex items-center truncate">
              <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate text-sm">{chat.title}</span>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this chat. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteChat(chat.id)} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatHistory; 