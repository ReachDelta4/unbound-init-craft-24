"use strict";
const { contextBridge, ipcRenderer } = require('electron');
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    saveFile: (options) => {
        return ipcRenderer.invoke('save-file', options);
    },
    openFile: (options) => {
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
//# sourceMappingURL=preload.js.map