import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileViewer } from '@capacitor/file-viewer';

window.customElements.define(
  'file-transfer-app',
  class extends HTMLElement {
    constructor() {
      super();

      const root = this.attachShadow({ mode: 'open' });

      root.innerHTML = `
        <style>
          :host {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            display: block;
            width: 100%;
            height: 100%;
          }
          .container {
            padding: 15px;
            max-width: 800px;
            margin: 0 auto;
          }
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
          }
          h1, h2 {
            color: #333;
            margin-top: 0;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            color: #666;
          }
          select, input[type="text"], input[type="url"], input[type="file"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          .progress-container {
            margin: 15px 0;
            display: none;
          }
          .progress-bar {
            background: #eee;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
          }
          .progress {
            background: #73B5F6;
            height: 100%;
            width: 0;
            transition: width 0.3s ease;
          }
          .progress-text {
            text-align: center;
            margin-top: 5px;
            color: #666;
          }
          button {
            background: #73B5F6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background: #5a9fe6;
          }
          pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
          }
        </style>
        <div class="container">
          <h1>File Transfer Example</h1>
          
          <div class="card">
            <h2>Download File</h2>
            <div class="form-group">
              <label for="downloadUrl">URL:</label>
              <select id="downloadUrl" class="url-select">
                <option value="">Select a file to download</option>
                <option value="https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf">Small PDF (~1KB)</option>
                <option value="https://raw.githubusercontent.com/kyokidG/large-pdf-viewer-poc/58a3df6adc4fe9bd5f02d2f583d6747e187d93ae/public/test2.pdf">Large PDF (~20MB)</option>
              </select>
              <input type="url" id="customDownloadUrl" placeholder="Or enter custom URL">
            </div>
            <div class="form-group">
              <label for="downloadDirectory">Directory:</label>
              <select id="downloadDirectory">
                <option value="DOCUMENTS">Documents</option>
                <option value="DATA">App Data</option>
                <option value="CACHE">Cache</option>
                <option value="EXTERNAL">External Storage</option>
              </select>
            </div>
            <div class="form-group">
              <label for="downloadPath">File Name:</label>
              <input type="text" id="downloadPath" placeholder="filename.ext">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="downloadProgress" checked>
                Show Progress
              </label>
            </div>
            <div class="progress-container" id="downloadProgressContainer">
              <div class="progress-bar">
                <div class="progress" id="downloadProgressBar"></div>
              </div>
              <div class="progress-text" id="downloadProgressText">0%</div>
            </div>
            <button id="downloadBtn">Download</button>
            <button id="openFileBtn" style="margin-left: 10px; background: #4CAF50;">Open File</button>
          </div>

          <div class="card">
            <h2>Upload File</h2>
            <div class="form-group">
              <label for="uploadUrl">Upload URL:</label>
              <select id="uploadUrl" class="url-select">
                <option value="">Select an upload endpoint</option>
                <option value="https://httpbin.org/post">HTTPBin (Test File Upload)</option>
              </select>
              <input type="url" id="customUploadUrl" placeholder="Or enter custom URL">
            </div>
            <div class="form-group">
              <label for="fileInput">File:</label>
              <input type="file" id="fileInput">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="uploadProgress" checked>
                Show Progress
              </label>
            </div>
            <div class="progress-container" id="uploadProgressContainer">
              <div class="progress-bar">
                <div class="progress" id="uploadProgressBar"></div>
              </div>
              <div class="progress-text" id="uploadProgressText">0%</div>
            </div>
            <button id="uploadBtn">Upload</button>
          </div>

          <div class="card">
            <h2>Response</h2>
            <pre id="response"></pre>
          </div>
        </div>
      `;

      this.progressListenerHandle = null;
    }

    connectedCallback() {
      this.initialize();
    }

    disconnectedCallback() {
      if (this.progressListenerHandle) {
        FileTransfer.removeAllListeners();
      }
    }

    async initialize() {
      try {
        // Add progress listener
        this.progressListenerHandle = await FileTransfer.addListener('progress', (progress) => {
          const percent = progress.lengthComputable
            ? Math.round((progress.bytes / progress.contentLength) * 100)
            : 0;

          // Update UI based on the type field
          if (progress.type === 'download') {
            this.updateDownloadProgress(percent);
          } else if (progress.type === 'upload') {
            this.updateUploadProgress(percent);
          }
        });

        // Set up event listeners
        const downloadProgress = this.shadowRoot.querySelector('#downloadProgress');
        const uploadProgress = this.shadowRoot.querySelector('#uploadProgress');
        const downloadProgressContainer = this.shadowRoot.querySelector('#downloadProgressContainer');
        const uploadProgressContainer = this.shadowRoot.querySelector('#uploadProgressContainer');

        downloadProgress.addEventListener('change', () => {
          downloadProgressContainer.style.display = downloadProgress.checked ? 'block' : 'none';
        });

        uploadProgress.addEventListener('change', () => {
          uploadProgressContainer.style.display = uploadProgress.checked ? 'block' : 'none';
        });

        this.shadowRoot.querySelector('#downloadBtn').addEventListener('click', () => this.handleDownload());
        this.shadowRoot.querySelector('#uploadBtn').addEventListener('click', () => this.handleUpload());
        this.shadowRoot.querySelector('#openFileBtn').addEventListener('click', () => this.handleOpenFile());

        // Set default paths
        const downloadPath = this.shadowRoot.querySelector('#downloadPath');
        downloadPath.value = 'test.pdf';

        // Initialize directories
        await this.initializeDirectories();

      } catch (error) {
        this.showError('Failed to initialize: ' + error.message);
      }
    }

    async initializeDirectories() {
      // Make sure directories exist
      try {
        // Create a test directory in Documents to verify everything is working
        if (Capacitor.getPlatform() !== 'web') {
          await Filesystem.mkdir({
            path: 'file-transfer-test',
            directory: Directory.Documents,
            recursive: true
          });
          
          this.showResponse('Directory check', { 
            message: 'Filesystem access confirmed - directories ready' 
          });
        }
      } catch (error) {
        this.showError('Directory initialization error: ' + error.message);
      }
    }

    getDownloadUrl() {
      const customUrl = this.shadowRoot.querySelector('#customDownloadUrl').value;
      const selectUrl = this.shadowRoot.querySelector('#downloadUrl').value;
      return customUrl || selectUrl;
    }

    getUploadUrl() {
      const customUrl = this.shadowRoot.querySelector('#customUploadUrl').value;
      const selectUrl = this.shadowRoot.querySelector('#uploadUrl').value;
      return customUrl || selectUrl;
    }

    getSelectedDirectory() {
      const directorySelect = this.shadowRoot.querySelector('#downloadDirectory');
      const selectedValue = directorySelect.value;

      if (selectedValue === 'DOCUMENTS') {
        return Directory.Documents;
      } else if (selectedValue === 'DATA') {
        return Directory.Data;
      } else if (selectedValue === 'CACHE') {
        return Directory.Cache;
      } else if (selectedValue === 'EXTERNAL') {
        return Directory.External;
      }
      return Directory.Documents;
    }

    async handleDownload() {
      try {
        const url = this.getDownloadUrl();
        const fileName = this.shadowRoot.querySelector('#downloadPath').value;
        const selectedDirectory = this.getSelectedDirectory();

        if (!url || !fileName) {
          this.showError('Please provide both URL and filename');
          return;
        }

        // Reset progress
        this.updateDownloadProgress(0);
        const downloadProgress = this.shadowRoot.querySelector('#downloadProgress');
        const downloadProgressContainer = this.shadowRoot.querySelector('#downloadProgressContainer');
        downloadProgressContainer.style.display = downloadProgress.checked ? 'block' : 'none';

        let filePath;
        
        if (Capacitor.getPlatform() === 'web') {
          // For web, we'll use a simple path
          filePath = fileName;
        } else {
          const pathResult = await Filesystem.getUri({
            path: 'file-transfer-test/' + fileName,
            directory: selectedDirectory
          });
          filePath = pathResult.uri;
        }

        // Download file
        const result = await FileTransfer.downloadFile({
          url,
          path: filePath,
          progress: downloadProgress.checked,
        });

        this.showResponse('Download completed', result);
      } catch (error) {
        this.showError('Download failed: ' + error.message);
      }
    }

    async handleUpload() {
      try {
        const url = this.getUploadUrl();
        const file = this.shadowRoot.querySelector('#fileInput').files[0];

        if (!url || !file) {
          this.showError('Please provide both URL and file');
          return;
        }

        // Reset progress
        this.updateUploadProgress(0);
        const uploadProgress = this.shadowRoot.querySelector('#uploadProgress');
        const uploadProgressContainer = this.shadowRoot.querySelector('#uploadProgressContainer');
        uploadProgressContainer.style.display = uploadProgress.checked ? 'block' : 'none';

        let filePath = file.name;
        // Upload file
        const result = await FileTransfer.uploadFile({
          url,
          path: filePath,
          blob: Capacitor.getPlatform() === 'web' ? file : undefined,
          progress: uploadProgress.checked,
        });

        this.showResponse('Upload completed', result);
      } catch (error) {
        this.showError('Upload failed: ' + error.message);
      }
    }

    async handleOpenFile() {
      if (Capacitor.getPlatform() === 'web') {
        this.showError('File viewer is not available on web platforms');
        return;
      }

      try {
        const fileName = this.shadowRoot.querySelector('#downloadPath').value;
        const selectedDirectory = this.getSelectedDirectory();
        
        if (!fileName) {
          this.showError('Please specify a file name to open');
          return;
        }

        let pathResult;
        
        try {
          // Try to get the file path
          pathResult = await Filesystem.getUri({
            path: 'file-transfer-test/' + fileName,
            directory: selectedDirectory
          });
          await FileViewer.openDocumentFromLocalPath({
            path: pathResult.uri
          });
        } catch (error) {
          this.showError('File not found. Please download it first.');
          return;
        }
        
        this.showResponse('File opened', { path: pathResult.uri });
      } catch (error) {
        this.showError('Failed to open file: ' + error.message);
      }
    }

    updateDownloadProgress(percent) {
      const progressBar = this.shadowRoot.querySelector('#downloadProgressBar');
      const progressText = this.shadowRoot.querySelector('#downloadProgressText');
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    }

    updateUploadProgress(percent) {
      const progressBar = this.shadowRoot.querySelector('#uploadProgressBar');
      const progressText = this.shadowRoot.querySelector('#uploadProgressText');
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    }

    showResponse(title, data) {
      // Create a copy of the data to modify
      const truncatedData = { ...data };
      
      // Truncate response if it exists and is too long
      if (truncatedData.response && truncatedData.response.length > 500) {
        truncatedData.response = truncatedData.response.substring(0, 500) + '... (truncated)';
      }
      
      // Truncate headers if they exist
      if (truncatedData.headers) {
        const truncatedHeaders = {};
        Object.entries(truncatedData.headers).forEach(([key, value]) => {
          truncatedHeaders[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
        });
        truncatedData.headers = truncatedHeaders;
      }

      this.shadowRoot.querySelector('#response').textContent = `${title}:\n${JSON.stringify(truncatedData, null, 2)}`;
    }

    showError(message) {
      this.shadowRoot.querySelector('#response').textContent = `Error: ${message}`;
    }
  }
); 
