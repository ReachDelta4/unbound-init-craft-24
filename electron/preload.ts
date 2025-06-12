const { contextBridge, ipcRenderer } = require('electron');

// TypeScript interfaces for IPC handlers
interface SaveFileOptions {
  content: string;
  defaultPath: string;
  filters: { name: string; extensions: string[] }[];
}

interface OpenFileOptions {
  filters: { name: string; extensions: string[] }[];
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (options: SaveFileOptions) => {
    return ipcRenderer.invoke('save-file', options);
  },
  
  openFile: (options: OpenFileOptions) => {
    return ipcRenderer.invoke('open-file', options);
  },
  
  // System information
  getPlatform: () => process.platform,
  
  // Audio permissions
  // These will be handled by the browser APIs already in use
});

// Notify the renderer process that preload script has loaded
// This can be useful for the app to know when it can use electron APIs
contextBridge.exposeInMainWorld('electronLoaded', true); 