interface ElectronAPI {
  saveFile: (options: { 
    content: string, 
    defaultPath: string, 
    filters: { name: string, extensions: string[] }[] 
  }) => Promise<{ 
    success?: boolean, 
    filePath?: string, 
    canceled?: boolean 
  }>;
  
  openFile: (options: { 
    filters: { name: string, extensions: string[] }[] 
  }) => Promise<{ 
    success?: boolean, 
    filePath?: string, 
    content?: string, 
    canceled?: boolean 
  }>;
  
  getPlatform: () => NodeJS.Platform;
}

interface Window {
  electronAPI: ElectronAPI;
  electronLoaded: boolean;
} 