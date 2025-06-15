/**
 * Browser detection utilities
 */

/**
 * Check if screen sharing is supported in the current environment
 */
export const isScreenSharingSupported = (): boolean => {
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