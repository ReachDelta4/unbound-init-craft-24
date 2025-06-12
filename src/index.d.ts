/// <reference types="vite/client" />

// Global type definitions

declare global {
  interface Window {
    // Electron API exposed by preload script
    electronAPI?: {
      saveFile: (options: {
        content: string;
        defaultPath?: string;
        filters?: Array<{ name: string; extensions: string[] }>;
      }) => Promise<{ success?: boolean; canceled?: boolean; filePath?: string }>;
      
      openFile: (options: {
        filters?: Array<{ name: string; extensions: string[] }>;
      }) => Promise<{ success?: boolean; canceled?: boolean; filePath?: string; content?: string }>;
      
      getDesktopSources: () => Promise<{
        success: boolean;
        sources?: Array<{
          id: string;
          name: string;
          thumbnail: string;
          display_id: string;
          appIcon: string | null;
        }>;
        error?: string;
      }>;
      
      getScreenSources: (options: {
        types: string[];
        thumbnailSize?: { width: number; height: number };
        fetchWindowIcons?: boolean;
      }) => Promise<Array<{
        id: string;
        name: string;
        thumbnail: string;
        display_id: string;
        appIcon: string | null;
      }>>;
      
      isElectron: boolean;
      platform: string;
    };
  }
}

export {}; 