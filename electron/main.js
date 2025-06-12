const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
  try {
    const electronSquirrelStartup = require('electron-squirrel-startup');
    if (electronSquirrelStartup) app.quit();
  } catch (e) {
    // Module might not be available, which is fine
  }
}

let mainWindow = null;

// These command line switches are needed for screen sharing to work properly
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
app.commandLine.appendSwitch('disable-features', 'MediaSessionService');

// Additional switches that might help with screen sharing
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('allow-insecure-localhost');
app.commandLine.appendSwitch('enable-media-stream');

// For Linux
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

// Register screen capture handler
app.on('ready', () => {
  // This will make screen capturing work on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

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
      webSecurity: true,
      // Enable media permissions
      enableWebSQL: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  // In production, load the bundled app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
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
  // Register screen sharing privileges for macOS
  if (process.platform === 'darwin') {
    try {
      app.dock.setIcon(path.join(__dirname, '../public/icon.png'));
    } catch (e) {
      console.error('Error setting dock icon:', e);
    }
  }

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
    if (!mainWindow) return { canceled: true };
    
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
    if (!mainWindow) return { canceled: true };
    
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

  // Handle desktop capturer sources request
  ipcMain.handle('get-desktop-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({ 
        types: ['window', 'screen'],
        fetchWindowIcons: true,
        thumbnailSize: { width: 150, height: 150 }
      });
      
      return {
        success: true,
        sources: sources.map(source => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL(),
          display_id: source.display_id || '',
          appIcon: source.appIcon?.toDataURL() || null
        }))
      };
    } catch (error) {
      console.error('Error getting desktop sources:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Direct access to desktopCapturer for the renderer process
  ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async (event, opts) => {
    try {
      const sources = await desktopCapturer.getSources(opts);
      return sources.map(source => {
        return {
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL(),
          display_id: source.display_id,
          appIcon: source.appIcon ? source.appIcon.toDataURL() : null
        };
      });
    } catch (error) {
      console.error('Error in DESKTOP_CAPTURER_GET_SOURCES:', error);
      throw error;
    }
  });
} 