import { WebPlugin, PluginListenerHandle } from '@capacitor/core';
import type {
  FileTransferPlugin,
  DownloadFileOptions,
  DownloadFileResult,
  UploadFileOptions,
  UploadFileResult,
  ProgressStatus,
  FileTransferError,
} from './definitions';

export class FileTransferWeb extends WebPlugin implements FileTransferPlugin {
  private progressListeners: ((progress: ProgressStatus) => void)[] = [];
  private lastProgressUpdate = 0;
  private readonly PROGRESS_UPDATE_INTERVAL = 100; // 100ms between progress updates

  async downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult> {
    try {
      // First, download the file
      const response = await this.makeRequest(options);
      const blob = await response.blob();

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = this.extractFilename(options.path, options.url);
      
      // If progress is enabled, track the download
      if (options.progress) {
        const reader = new FileReader();
        let loaded = 0;
        const total = blob.size;

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            loaded = event.loaded;
            this.notifyProgress(options.url, loaded, total, true, 'download');
          }
        };

        // Read the blob to track progress
        reader.readAsArrayBuffer(blob);
      }

      // Trigger the download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the blob URL
      URL.revokeObjectURL(url);

      return {
        blob,
        path: options.path,
      };
    } catch (error) {
      throw this.handleError(error, options.url, options.path);
    }
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    try {
      let blob: Blob;
      if (options.blob) {
        blob = options.blob;
      } else {
        // In web, we can't read from file path, so we need to throw an error
        throw new Error('File upload from path is not supported in web. Please provide a blob instead.');
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = this.buildUrl(options.url, options.params);

        // Set up progress tracking if enabled
        if (options.progress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              this.notifyProgress(options.url, event.loaded, event.total, true, 'upload');
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const headers: { [key: string]: string } = {};
            xhr.getAllResponseHeaders().split('\r\n').forEach(header => {
              const [key, value] = header.split(': ');
              if (key && value) {
                headers[key] = value;
              }
            });

            resolve({
              bytesSent: blob.size,
              responseCode: xhr.status.toString(),
              response: xhr.responseText,
              headers,
            });
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };

        xhr.open(options.method || 'POST', url, true);

        // Set headers
        if (options.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        // Create FormData and append file
        const formData = new FormData();
        const fileKey = options.fileKey || 'file';
        formData.append(fileKey, blob, options.path);

        // Add any additional parameters
        if (options.params) {
          Object.entries(options.params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(v => formData.append(key, v));
            } else {
              formData.append(key, value);
            }
          });
        }

        // Send the request
        xhr.send(formData);
      });
    } catch (error) {
      throw this.handleError(error, options.path, options.url);
    }
  }

  async addListener(
    eventName: 'progress',
    listenerFunc: (progress: ProgressStatus) => void,
  ): Promise<PluginListenerHandle> {
    if (eventName !== 'progress') {
      throw new Error('Invalid event name');
    }
    this.progressListeners.push(listenerFunc);
    return {
      remove: async () => {
        this.progressListeners = this.progressListeners.filter(l => l !== listenerFunc);
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    this.progressListeners = [];
  }

  private async makeRequest(options: DownloadFileOptions): Promise<Response> {
    const url = this.buildUrl(options.url, options.params);
    const headers = new Headers(options.headers);

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      redirect: options.disableRedirects ? 'manual' : 'follow',
    };

    const controller = new AbortController();
    const timeout = options.connectTimeout || 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(
    baseUrl: string,
    params?: { [key: string]: string | string[] },
  ): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  private notifyProgress(url: string, bytes: number, contentLength: number, lengthComputable: boolean, type: 'download' | 'upload') {
    const currentTime = Date.now();
    if (currentTime - this.lastProgressUpdate >= this.PROGRESS_UPDATE_INTERVAL) {
      const progress: ProgressStatus = {
        type,
        url,
        bytes,
        contentLength,
        lengthComputable,
      };

      this.progressListeners.forEach(listener => listener(progress));
      this.lastProgressUpdate = currentTime;
    }
  }

  private handleError(error: any, source: string, target: string): FileTransferError {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        code: 'OS-PLUG-FLTR-0009',
        message: 'Failed to connect to server',
        source,
        target,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'OS-PLUG-FLTR-0011',
        message: error.message,
        source,
        target,
      };
    }

    return {
      code: 'OS-PLUG-FLTR-0011',
      message: 'An unknown error occurred',
      source,
      target,
    };
  }

  private extractFilename(path: string, url: string): string {
    // Remove any query parameters or hash fragments
    const cleanPath = path.split('?')[0].split('#')[0];
    
    // Get the last part of the path
    const parts = cleanPath.split(/[/\\]/);
    let filename = parts[parts.length - 1];
    
    // If the filename doesn't have an extension, try to get it from the URL
    if (!filename.includes('.')) {
      const urlParts = url.split('.');
      if (urlParts.length > 1) {
        const extension = urlParts[urlParts.length - 1].split('?')[0];
        const filenameWithoutExtension = urlParts[urlParts.length - 2].split('/').pop();

        filename = `${filenameWithoutExtension}.${extension}`;
      }
    }

    // If no filename found or it's empty, use a default
    if (!filename) {
      filename = 'download';
    }
    
    return filename;
  }
}
