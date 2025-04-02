import { FileTransfer } from '@capacitor/file-transfer';

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
              <label for="downloadPath">Save Path:</label>
              <input type="text" id="downloadPath" placeholder="/path/to/save/file">
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

        // Set default paths
        const downloadPath = this.shadowRoot.querySelector('#downloadPath');
        downloadPath.value = '/storage/emulated/0/Download/test.pdf';
        if (Capacitor.getPlatform() === 'web') {
          downloadPath.value = 'Downloads/';
        }

      } catch (error) {
        this.showError('Failed to initialize: ' + error.message);
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

    async handleDownload() {
      try {
        const url = this.getDownloadUrl();
        const path = this.shadowRoot.querySelector('#downloadPath').value;

        if (!url || !path) {
          this.showError('Please provide both URL and path');
          return;
        }

        // Reset progress
        this.updateDownloadProgress(0);
        const downloadProgress = this.shadowRoot.querySelector('#downloadProgress');
        const downloadProgressContainer = this.shadowRoot.querySelector('#downloadProgressContainer');
        downloadProgressContainer.style.display = downloadProgress.checked ? 'block' : 'none';

        // Download file
        const result = await FileTransfer.downloadFile({
          url,
          path,
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

        // Upload file
        const result = await FileTransfer.uploadFile({
          url,
          path: `${Capacitor.getPlatform() === 'web' ? '' : '/storage/emulated/0/Download/'}` + file.name,
          blob: file,
          progress: uploadProgress.checked,
        });

        this.showResponse('Upload completed', result);
      } catch (error) {
        this.showError('Upload failed: ' + error.message);
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