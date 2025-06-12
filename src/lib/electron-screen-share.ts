/**
 * Utility functions for screen sharing in Electron
 */

// Check if running in Electron
export const isElectron = (): boolean => {
  return window.isElectron === true;
};

interface DesktopSource {
  id: string;
  name: string;
  thumbnail: string;
  display_id: string;
  appIcon?: string;
}

// Get desktop sources using Electron's desktopCapturer
export const getDesktopSources = async (): Promise<DesktopSource[]> => {
  if (!isElectron() || !window.electronAPI) {
    return [];
  }

  try {
    const result = await window.electronAPI.getDesktopSources();
    if (result.success) {
      return result.sources;
    }
    console.error('Error getting desktop sources:', result.error);
    return [];
  } catch (error) {
    console.error('Error calling getDesktopSources:', error);
    return [];
  }
};

// Get screen sources using Electron API
export const getScreenSources = async (): Promise<MediaStream | null> => {
  if (!isElectron()) {
    // Fall back to browser API if not in Electron
    try {
      return await navigator.mediaDevices.getDisplayMedia({ 
        audio: true, 
        video: true 
      });
    } catch (error) {
      console.error('Error getting display media:', error);
      return null;
    }
  }

  try {
    // Use Electron API
    const result = await window.electronAPI.getScreenSources();
    
    if (result.completed) {
      // If Electron successfully got the sources, we should already have a stream
      // from the preload script's executeJavaScript call
      return null; // The stream is already handled in the main process
    } else {
      console.error('Error getting screen sources:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error calling Electron API:', error);
    return null;
  }
}; 