import { HttpOptions, PluginListenerHandle } from '@capacitor/core';

export interface DownloadFileOptions extends HttpOptions {
  /**
   * The full file path the downloaded file should be moved to.
   */
  path: string;
  /**
   * If true, progress event will be dispatched on every chunk received.
   * See addListener() for more information.
   * Chunks are throttled to every 100ms on Android/iOS to avoid slowdowns.
   */
  progress?: boolean;
}

export interface DownloadFileResult {
  /**
   * The path the file was downloaded to.
   */
  path?: string;
  /**
   * The blob data of the downloaded file.
   * This is only available on web.
   */
  blob?: Blob;
}

export interface UploadFileOptions extends HttpOptions {
  /**
   * Full file path of the file to upload.
   */
  path: string;
  /**
   * Blob data to upload. Will use this instead of path if provided.
   * This is only available on web.
   */
  blob?: Blob;
  /**
   * Whether to upload data in a chunked streaming mode.
   * Not supported on web.
   */
  chunkedMode?: boolean;
  /**
   * Mime type of the data to upload.
   * Only used if "Content-Type" header was not provided.
   */
  mimeType?: string;
  /**
   * Type of form element. The default is set to "file".
   * Only used if "Content-Type" header was not provided.
   */
  fileKey?: string;
  /**
   * If true, progress event will be dispatched on every chunk received.
   * See addListener() for more information.
   * Chunks are throttled to every 100ms on Android/iOS to avoid slowdowns.
   */
  progress?: boolean;
}

export interface UploadFileResult {
  /**
   * Total number of bytes uploaded
   */
  bytesSent: number;
  /**
   * HTTP response code for the upload
   */
  responseCode: string;
  /**
   * HTTP response body from the upload (when available)
   */
  response?: string;
  /**
   * HTTP headers from the upload response (when available)
   */
  headers?: { [key: string]: string };
}

export interface ProgressStatus {
  /**
   * The type of transfer operation (download or upload).
   */
  type: 'download' | 'upload';
  /**
   * The url of the file associated with the transfer (download or upload).
   */
  url: string;
  /**
   * The number of bytes transferred so far.
   */
  bytes: number;
  /**
   * The total number of bytes associated with the file transfer.
   */
  contentLength: number;
  /**
   * Whether or not the contentLength value is relevant.
   * In some situations, the total number of bytes may not be possible to determine.
   */
  lengthComputable: boolean;
}

export interface FileTransferError {
  /**
   * Code identifying the error: OS-PLUG-FLTR-XXXX
   */
  code: string;
  /**
   * Message informing of what went wrong
   */
  message: string;
  /**
   * The source for the file transfer operation (a url for download, a file path for upload)
   */
  source?: string;
  /**
   * The target of the file transfer operation (a file path for download, a url for upload)
   */
  target?: string;
  /**
   * HTTP status code of the server response (if available)
   */
  httpStatus?: number;
  /**
   * HTTP error response body from the server (if available)
   */
  body?: string;
  /**
   * Exception message thrown on native side (if available)
   */
  exception?: string;
}

export interface FileTransferPlugin {
  /**
   * Perform an HTTP request to a server and download the file to the specified destination.
   */
  downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult>;
  /**
   * Perform an HTTP request to upload a file to a server
   */
  uploadFile(options: UploadFileOptions): Promise<UploadFileResult>;
  /**
   * Add a listener to file transfer (download or upload) progress events.
   */
  addListener(
    eventName: 'progress',
    listenerFunc: (progress: ProgressStatus) => void,
  ): Promise<PluginListenerHandle>;
  /**
   * Remove all listeners for this plugin.
   */
  removeAllListeners(): Promise<void>;
}
