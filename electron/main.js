const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

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
let n8nProcess = null;
let llamaProcess = null;

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
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Start n8n as a child process
async function startN8n() {
  console.log('Starting n8n...');
  
  // Start n8n as a child process
  n8nProcess = exec('npx n8n start', {
    env: {
      ...process.env,
      N8N_PORT: '5678',
      N8N_HOST: '127.0.0.1',
      N8N_BASIC_AUTH_ACTIVE: 'false', // Disable auth for local use
      N8N_METRICS: 'false'
    }
  });
  
  n8nProcess.stdout.on('data', (data) => {
    console.log('n8n:', data.toString());
  });

  n8nProcess.stderr.on('data', (data) => {
    console.error('n8n error:', data.toString());
  });
  
  console.log('n8n starting... please wait');
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
  console.log('n8n should be ready now');
}

// Start llama.cpp server as a child process
async function startLlamaServer() {
  console.log('Starting llama.cpp server...');
  
  // Path to the llama-server executable and model
  const llamaServerPath = path.join(__dirname, '../resources/llama-cpp/llama-server.exe');
  const modelPath = path.join(__dirname, '../models/Phi-3-mini-128k-instruct.Q4_K_M.gguf');
  
  // Check if the llama-server executable exists
  if (!fs.existsSync(llamaServerPath)) {
    console.error('Error: llama-server.exe not found at', llamaServerPath);
    console.error('Please make sure to download and place llama-server.exe in the resources/llama-cpp directory');
    return false;
  }
  
  // Check if the model file exists
  if (!fs.existsSync(modelPath)) {
    console.error('Error: Model file not found at', modelPath);
    console.error('Please make sure the Phi-3 model file is in the models directory');
    return false;
  }
  
  // Start the llama.cpp server
  const llamaCommand = `"${llamaServerPath}" -m "${modelPath}" --port 8080 --host 127.0.0.1`;
  llamaProcess = exec(llamaCommand);
  
  llamaProcess.stdout.on('data', (data) => {
    console.log('llama.cpp:', data.toString());
  });
  
  llamaProcess.stderr.on('data', (data) => {
    console.error('llama.cpp error:', data.toString());
  });
  
  console.log('llama.cpp server starting... please wait');
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
  console.log('llama.cpp server should be ready now');
  return true;
}

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

  await startN8n(); // Start n8n before creating the window
  await startLlamaServer(); // Start llama.cpp server
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

// Cleanup when app is quitting
app.on('before-quit', () => {
  if (n8nProcess) {
    console.log('Shutting down n8n...');
    n8nProcess.kill();
  }
  
  if (llamaProcess) {
    console.log('Shutting down llama.cpp server...');
    llamaProcess.kill();
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
  
  // n8n status handler
  ipcMain.handle('n8n-status', async () => {
    return {
      running: n8nProcess !== null,
      url: 'http://127.0.0.1:5678'
    };
  });
  
  // llama.cpp status handler
  ipcMain.handle('llama-status', async () => {
    return {
      running: llamaProcess !== null,
      url: 'http://127.0.0.1:8080'
    };
  });
} 