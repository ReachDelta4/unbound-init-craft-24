/**
 * Browser detection utilities with special handling for Electron
 */

/**
 * Check if running in Electron environment
 */
export const isElectron = (): boolean => {
  // Preferred: check flag exposed by preload script via electronAPI or global
  if (typeof window !== 'undefined') {
    // Newer approach – flag inside electronAPI
    if (window.electronAPI && window.electronAPI.isElectron) {
      return true;
    }

    // Legacy approach – flag directly on window
    if ((window as any).isElectron === true) {
      return true;
    }
  }
  
  // Fallback to user agent detection
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent.toLowerCase();
  return userAgent.includes(' electron/');
};

/**
 * Check if screen sharing is supported in the current environment
 */
export const isScreenSharingSupported = (): boolean => {
  // If we're in Electron, screen sharing is supported
  if (isElectron()) {
    return true;
  }
  
  // Check if the browser supports getDisplayMedia
  return (
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );
};

/**
 * Get browser name and version
 */
export const getBrowserInfo = (): { name: string; version: string } => {
  const userAgent = navigator.userAgent;
  
  if (isElectron()) {
    return { name: 'Electron', version: 'Unknown' };
  }
  
  if (userAgent.indexOf('Firefox') !== -1) {
    const version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    return { name: 'Firefox', version };
  }
  
  if (userAgent.indexOf('Chrome') !== -1) {
    const version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    return { name: 'Chrome', version };
  }
  
  if (userAgent.indexOf('Safari') !== -1) {
    const version = userAgent.match(/Safari\/([0-9.]+)/)?.[1] || 'Unknown';
    return { name: 'Safari', version };
  }
  
  if (userAgent.indexOf('Edge') !== -1) {
    const version = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    return { name: 'Edge', version };
  }
  
  return { name: 'Unknown', version: 'Unknown' };
}; 