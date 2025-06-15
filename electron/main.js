const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

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
let sttServerProcess = null;

// Function to start the STT server
const startSTTServer = () => {
  const sttBatchPath = path.join(__dirname, '../frontend/stt_backend/start_stt_server_optimized_realtime.bat');
  
  if (fs.existsSync(sttBatchPath)) {
    console.log('Starting STT server...');
    sttServerProcess = spawn('cmd.exe', ['/c', sttBatchPath], {
      detached: false,
      windowsHide: false,
      // Set process group ID so we can kill the entire process tree
      ...(process.platform !== 'win32' && { detached: true })
    });
    
    // Don't let the parent process wait for this child to exit
    if (process.platform !== 'win32') {
      sttServerProcess.unref();
    }
    
    sttServerProcess.stdout.on('data', (data) => {
      console.log(`STT Server: ${data}`);
    });
    
    sttServerProcess.stderr.on('data', (data) => {
      console.error(`STT Server Error: ${data}`);
    });
    
    sttServerProcess.on('close', (code) => {
      console.log(`STT Server process exited with code ${code}`);
      sttServerProcess = null;
    });
  } else {
    console.error('STT batch file not found at:', sttBatchPath);
  }
};

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
      // Disable developer tools
      devTools: false
    },
  });

  // Remove the menu bar
  Menu.setApplicationMenu(null);

  // In production, load the bundled app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // In development, load from the dev server
    mainWindow.loadURL('http://localhost:3000');
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Register screen sharing privileges for macOS
  if (process.platform === 'darwin') {
    try {
      app.dock.setIcon(path.join(__dirname, '../public/icon.png'));
    } catch (e) {
      console.error('Error setting dock icon:', e);
    }
  }

  createWindow();
  
  // Start the STT server
  startSTTServer();

  // Setup IPC handlers for file operations
  setupIpcHandlers();

  // Disable keyboard shortcuts for developer tools
  app.on('web-contents-created', (event, contents) => {
    contents.on('before-input-event', (event, input) => {
      // Prevent F12, Ctrl+Shift+I, Cmd+Opt+I
      const isDeveloperShortcut = 
        (input.key === 'F12') || 
        ((input.control || input.meta) && (input.shift || input.alt) && input.key.toLowerCase() === 'i');
      
      if (isDeveloperShortcut) {
        event.preventDefault();
      }
    });
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  // Kill STT server process if it's running
  if (sttServerProcess) {
    sttServerProcess.kill();
    sttServerProcess = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Make sure to kill the STT server process when the app is about to quit
app.on('before-quit', () => {
  console.log('Application is about to quit, killing STT server...');
  if (sttServerProcess) {
    try {
      // Force kill the process and any child processes
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        // On Windows, we need to use taskkill to ensure all child processes are terminated
        spawn('taskkill', ['/pid', sttServerProcess.pid, '/f', '/t']);
      } else {
        // On Unix-like systems, negative PID kills the process group
        process.kill(-sttServerProcess.pid);
      }
    } catch (error) {
      console.error('Failed to kill STT server process:', error);
    } finally {
      sttServerProcess = null;
    }
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
} 