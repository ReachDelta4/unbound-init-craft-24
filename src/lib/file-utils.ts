/**
 * Browser-compatible file utilities for saving and opening files
 */

import { saveAs } from 'file-saver';

/**
 * Save content to a file using browser's download capabilities
 */
export const saveToFile = async (
  content: string | Blob,
  filename: string,
  fileType?: string
): Promise<{ success: boolean; filePath?: string }> => {
  try {
    let blob: Blob;
    
    if (content instanceof Blob) {
      blob = content;
    } else {
      // Convert string to blob with appropriate MIME type
      const mimeType = getMimeType(fileType || filename.split('.').pop() || '');
      blob = new Blob([content], { type: mimeType });
    }
    
    // Use FileSaver.js to trigger download
    saveAs(blob, filename);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false };
  }
};

/**
 * Open a file using browser's file input
 */
export const openFile = async (
  options: { 
    filters?: Array<{ name: string; extensions: string[] }> 
  } = {}
): Promise<{ success: boolean; filePath?: string; content?: string } | null> => {
  return new Promise((resolve) => {
    // Create a temporary file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    // Set accept attribute based on filters
    if (options.filters && options.filters.length > 0) {
      const extensions = options.filters
        .flatMap(filter => filter.extensions.map(ext => `.${ext}`))
        .join(',');
      fileInput.accept = extensions;
    }
    
    // Handle file selection
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const content = await file.text();
        resolve({
          success: true,
          filePath: file.name,
          content
        });
      } catch (error) {
        console.error('Error reading file:', error);
        resolve({ success: false });
      }
    };
    
    // Handle cancellation
    fileInput.oncancel = () => {
      resolve(null);
    };
    
    // Trigger file selection dialog
    fileInput.click();
  });
};

/**
 * Get MIME type based on file extension
 */
const getMimeType = (extension: string): string => {
  const ext = extension.toLowerCase();
  
  switch (ext) {
    case 'txt':
      return 'text/plain';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'mp3':
      return 'audio/mpeg';
    case 'mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}; 