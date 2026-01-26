/* eslint-env browser */
import { WebPlugin } from "@capacitor/core";
import type {
  FileTransferPlugin,
  DownloadFileOptions,
  DownloadFileResult,
  UploadFileOptions,
  UploadFileResult,
  ProgressStatus,
  FileTransferError,
} from "./definitions";

// Type definitions for the Capacitor Filesystem API
interface FilesystemPlugin {
  readFile(options: { path: string }): Promise<{ data: string }>;
  stat(options: { path: string }): Promise<{ data: string }>;
  writeFile(options: {
    path: string;
    data: string;
    recursive?: boolean;
  }): Promise<void>;
  mkdir(options: { path: string; recursive?: boolean }): Promise<void>;
}

// Extend Window interface to include Capacitor
declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        Filesystem?: FilesystemPlugin;
      };
    };
  }
}

export class FileTransferWeb extends WebPlugin implements FileTransferPlugin {
  private lastProgressUpdate = 0;
  private readonly PROGRESS_UPDATE_INTERVAL = 100; // 100ms between progress updates

  async downloadFile(
    options: DownloadFileOptions,
  ): Promise<DownloadFileResult> {
    try {
      const url = this.buildUrl(options.url, options.params);
      const headers = new Headers(options.headers);

      const requestOptions: RequestInit = {
        method: options.method || "GET",
        headers,
        redirect: options.disableRedirects ? "manual" : "follow",
      };

      const controller = new AbortController();
      const timeout = options.connectTimeout || 60000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let blob: Blob;
      let totalBytes = 0;

      try {
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        // Handle progress reporting during download if needed
        if (options.progress && response.body) {
          const reader = response.body.getReader();
          const contentLength = parseInt(
            response.headers.get("content-length") || "0",
            10,
          );
          const contentType = response.headers.get("content-type") || "";

          let receivedLength = 0;
          const chunks: Uint8Array[] = [];

          // Read the data stream
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            if (value) {
              chunks.push(value);
              receivedLength += value.length;

              this.notifyProgress(
                options.url,
                receivedLength,
                contentLength,
                contentLength > 0,
                "download",
              );
            }
          }

          // Concatenate chunks into a single blob
          const chunksAll = new Uint8Array(receivedLength);
          let position = 0;
          for (const chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
          }

          blob = new Blob([chunksAll], { type: contentType });
          totalBytes = receivedLength;

          // Send final progress update
          if (options.progress) {
            this.notifyProgress(
              options.url,
              totalBytes,
              totalBytes, // Set content length equal to bytes for 100%
              true,
              "download",
              true, // Force update
            );
          }
        } else {
          // If progress not needed, just get the blob directly
          blob = await response.blob();
          totalBytes = blob.size;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      // If Filesystem plugin is available, try to write the file
      const filesystemResult = await this.tryWriteToFilesystem(
        blob,
        options.path,
      );
      if (filesystemResult) {
        return {
          path: options.path,
          blob,
        };
      }

      // Otherwise, trigger browser download
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = this.extractFilename(options.path, options.url);

      // Trigger the download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

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
        // Try to read from path using Filesystem if available
        const fileData = await this.tryReadFromFilesystem(options.path);
        if (fileData) {
          blob = fileData;
        } else {
          throw new Error(
            "File upload from path is not supported in web without @capacitor/filesystem plugin. Please provide a blob instead.",
          );
        }
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = this.buildUrl(options.url, options.params);

        // Set up progress tracking if enabled
        if (options.progress) {
          xhr.upload.onprogress = (event) => {
            this.notifyProgress(
              options.url,
              event.loaded,
              event.total,
              event.lengthComputable,
              "upload",
            );
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Send final progress update to ensure 100% is shown
            if (options.progress) {
              this.notifyProgress(
                options.url,
                blob.size, // Total bytes
                blob.size, // Same for content length to show 100%
                true,
                "upload",
                true, // Force update
              );
            }

            const headers: { [key: string]: string } = {};
            xhr
              .getAllResponseHeaders()
              .split("\r\n")
              .forEach((header) => {
                const [key, value] = header.split(": ");
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
            reject(new Error(`HTTP error: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error occurred"));
        };

        xhr.open(options.method || "POST", url, true);

        // Set headers
        if (options.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        // Create FormData and append file
        const formData = new FormData();
        const fileKey = options.fileKey || "file";
        formData.append(fileKey, blob, options.path);

        // Add any additional parameters
        if (options.params) {
          Object.entries(options.params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => formData.append(key, v));
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
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  private notifyProgress(
    url: string,
    bytes: number,
    contentLength: number,
    lengthComputable: boolean,
    type: "download" | "upload",
    forceUpdate: boolean = false,
  ) {
    const currentTime = Date.now();
    if (
      forceUpdate ||
      currentTime - this.lastProgressUpdate >= this.PROGRESS_UPDATE_INTERVAL
    ) {
      const progressData: ProgressStatus = {
        type,
        url,
        bytes,
        contentLength,
        lengthComputable,
      };

      this.notifyListeners("progress", progressData);
      this.lastProgressUpdate = currentTime;
    }
  }

  private handleError(
    error: any,
    source: string,
    target: string,
  ): FileTransferError {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        code: "OS-PLUG-FLTR-0008",
        message: "Failed to connect to server",
        source,
        target,
      };
    }

    if (error instanceof Error) {
      return {
        code: "OS-PLUG-FLTR-0011",
        message: error.message,
        source,
        target,
      };
    }

    return {
      code: "OS-PLUG-FLTR-0011",
      message: "An unknown error occurred",
      source,
      target,
    };
  }

  private extractFilename(path: string, url: string): string {
    // Remove any query parameters or hash fragments
    const cleanPath = path.split("?")[0].split("#")[0];

    // Get the last part of the path
    const parts = cleanPath.split(/[/\\]/);
    let filename = parts[parts.length - 1];

    // If the filename doesn't have an extension, try to get it from the URL
    if (!filename.includes(".")) {
      const urlParts = url.split(".");
      if (urlParts.length > 1) {
        const extension = urlParts[urlParts.length - 1].split("?")[0];
        const filenameWithoutExtension = urlParts[urlParts.length - 2]
          .split("/")
          .pop();

        filename = `${filenameWithoutExtension}.${extension}`;
      }
    }

    // If no filename found or it's empty, use a default
    if (!filename) {
      filename = "download";
    }

    return filename;
  }

  /**
   * Checks if the Capacitor Filesystem plugin is available
   */
  private isFilesystemAvailable(): boolean {
    try {
      return !!(globalThis as any)?.Capacitor?.Plugins?.Filesystem;
    } catch {
      return false;
    }
  }

  /**
   * Attempts to read a file using the Filesystem plugin if available
   * @param path Path to the file
   * @returns Blob with file contents or null if Filesystem plugin is not available
   */
  private async tryReadFromFilesystem(path: string): Promise<Blob | null> {
    if (!this.isFilesystemAvailable()) {
      return null;
    }

    try {
      // Read the file data as base64
      const filesystem = window.Capacitor?.Plugins?.Filesystem;
      if (!filesystem) {
        return null;
      }

      const result = await filesystem.readFile({
        path: path,
      });

      // Convert base64 to Blob
      const base64Data = result.data;
      if (!base64Data) {
        throw new Error("No data returned from Filesystem plugin");
      }

      // Determine MIME type from file extension or use a default
      const mimeType =
        this.getMimeTypeFromPath(path) || "application/octet-stream";

      // Convert base64 to Blob
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      return new Blob(byteArrays, { type: mimeType });
    } catch (error) {
      console.error("Error reading file from Filesystem:", error);
      return null;
    }
  }

  /**
   * Attempts to write a blob to a file using the Filesystem plugin if available
   * @param blob Blob data to write
   * @param path Path to write the file to
   * @returns true if the file was written successfully, false if Filesystem plugin is not available
   */
  private async tryWriteToFilesystem(
    blob: Blob,
    path: string,
  ): Promise<boolean> {
    if (!this.isFilesystemAvailable()) {
      return false;
    }

    try {
      const filesystem = window.Capacitor?.Plugins?.Filesystem;
      if (!filesystem) {
        return false;
      }

      const base64Data = await this.blobToBase64(blob);
      if (!base64Data) {
        throw new Error("Failed to convert blob to base64");
      }

      // Create any parent directories needed
      const pathParts = path.split("/");
      if (pathParts.length > 1) {
        const directory = pathParts.slice(0, -1).join("/");
        await filesystem.stat({ path: directory }).catch(async () => {
          await filesystem.mkdir({
            path: directory,
            recursive: true,
          });
        });
      }

      // Write the file
      await filesystem.writeFile({
        path: path,
        data: base64Data.split(",")[1], // Remove the data:application/octet-stream;base64, part
        recursive: true,
      });

      return true;
    } catch (error) {
      console.error("Error writing file to Filesystem:", error);
      return false;
    }
  }

  /**
   * Converts a Blob to a base64 string
   * @param blob The blob to convert
   * @returns Promise that resolves to the base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error("Failed to convert blob to base64"));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Gets MIME type from file path based on extension
   * @param path File path
   * @returns MIME type string or null if unable to determine
   */
  private getMimeTypeFromPath(path: string): string | null {
    const extension = path.split(".").pop()?.toLowerCase();
    if (!extension) return null;

    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      pdf: "application/pdf",
      txt: "text/plain",
      html: "text/html",
      htm: "text/html",
      json: "application/json",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip: "application/zip",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      wav: "audio/wav",
      xml: "application/xml",
      csv: "text/csv",
    };

    return mimeTypes[extension] || null;
  }
}
