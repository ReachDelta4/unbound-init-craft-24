/**
 * Utility functions for Electron integration
 */

/**
 * Check if the app is running in Electron
 */
export const isElectron = (): boolean => {
  return window.electronLoaded === true;
};

/**
 * Save content to a file using Electron's dialog
 */
export const saveToFile = async (
  content: string,
  filename: string,
  fileType: 'text' | 'docx' | 'pdf' | 'json' = 'text'
): Promise<string | null> => {
  if (!isElectron()) {
    // Fallback to browser download if not in Electron
    const blob = new Blob([content], { type: getContentType(fileType) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return filename;
  }

  // Use Electron's native dialog
  const filters = getFileFilters(fileType);
  const result = await window.electronAPI.saveFile({
    content,
    defaultPath: filename,
    filters
  });

  return result.success ? result.filePath || null : null;
};

/**
 * Open a file using Electron's dialog
 */
export const openFile = async (
  fileType: 'text' | 'docx' | 'pdf' | 'json' = 'text'
): Promise<{ content: string; filePath: string } | null> => {
  if (!isElectron()) {
    // Fallback to browser file input if not in Electron
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = getAcceptType(fileType);
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            content: reader.result as string,
            filePath: file.name
          });
        };
        reader.readAsText(file);
      };
      
      input.click();
    });
  }

  // Use Electron's native dialog
  const filters = getFileFilters(fileType);
  const result = await window.electronAPI.openFile({ filters });

  return result.success && result.content
    ? { content: result.content, filePath: result.filePath || '' }
    : null;
};

/**
 * Get the current platform
 */
export const getPlatform = (): string => {
  if (isElectron()) {
    return window.electronAPI.getPlatform();
  }
  return 'browser';
};

// Helper functions

function getContentType(fileType: 'text' | 'docx' | 'pdf' | 'json'): string {
  switch (fileType) {
    case 'text':
      return 'text/plain';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

function getAcceptType(fileType: 'text' | 'docx' | 'pdf' | 'json'): string {
  switch (fileType) {
    case 'text':
      return '.txt';
    case 'docx':
      return '.docx';
    case 'pdf':
      return '.pdf';
    case 'json':
      return '.json';
    default:
      return '';
  }
}

function getFileFilters(fileType: 'text' | 'docx' | 'pdf' | 'json'): { name: string; extensions: string[] }[] {
  switch (fileType) {
    case 'text':
      return [{ name: 'Text Files', extensions: ['txt'] }];
    case 'docx':
      return [{ name: 'Word Documents', extensions: ['docx'] }];
    case 'pdf':
      return [{ name: 'PDF Documents', extensions: ['pdf'] }];
    case 'json':
      return [{ name: 'JSON Files', extensions: ['json'] }];
    default:
      return [{ name: 'All Files', extensions: ['*'] }];
  }
} 