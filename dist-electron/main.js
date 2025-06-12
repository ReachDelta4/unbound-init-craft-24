"use strict";
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
    try {
        const electronSquirrelStartup = require('electron-squirrel-startup');
        if (electronSquirrelStartup)
            app.quit();
    }
    catch (e) {
        // Module might not be available, which is fine
    }
}
let mainWindow = null;
const createWindow = () => {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        },
    });
    // In production, load the bundled app
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    else {
        // In development, load from the dev server
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    }
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};
// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();
    // Setup IPC handlers for file operations
    setupIpcHandlers();
    app.on('activate', () => {
        // On macOS it's common to re-create a window when the dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// Setup IPC handlers for communication between renderer and main process
function setupIpcHandlers() {
    // Example: Save file dialog
    ipcMain.handle('save-file', async (_, options) => {
        if (!mainWindow)
            return { canceled: true };
        const { content, defaultPath, filters } = options;
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath,
            filters,
        });
        if (!canceled && filePath) {
            fs.writeFileSync(filePath, content);
            return { success: true, filePath };
        }
        return { canceled };
    });
    // Example: Open file dialog
    ipcMain.handle('open-file', async (_, options) => {
        if (!mainWindow)
            return { canceled: true };
        const { filters } = options;
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters,
        });
        if (!canceled && filePaths.length > 0) {
            const content = fs.readFileSync(filePaths[0], 'utf8');
            return { success: true, filePath: filePaths[0], content };
        }
        return { canceled };
    });
}
//# sourceMappingURL=main.js.map