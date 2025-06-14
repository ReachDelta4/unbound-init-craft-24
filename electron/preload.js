const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  
  // Screen sharing
  getDesktopSources: (options) => ipcRenderer.invoke('get-desktop-sources', options),
  getScreenSources: (options) => ipcRenderer.invoke('get-desktop-sources', options),
  
  // Environment info
  isElectron: true,
  platform: process.platform
});

// Log when preload script has executed
console.log('Preload script has been loaded');

// Also expose a simple flag directly on the window for legacy checks
contextBridge.exposeInMainWorld('isElectron', true); 