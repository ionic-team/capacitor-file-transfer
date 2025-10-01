<div align="center">
  <img src=".github/assets/logo.png" alt="Logo" width="auto" height="100">

  <h3 align="center"> @capacitor/file-transfer</h3>

  <p align="center">
    The FileTransfer API provides mechanisms for downloading and uploading files.
    <br />
    <a href="https://github.com/ionic-team/cordova-outsystems-file-transfer">🔌 Cordova Plugin</a>
    ·
    <a href="https://github.com/ionic-team/ion-android-filetransfer">🤖 Android Library</a>
    ·
    <a href="https://github.com/ionic-team/ion-ios-filetransfer">🍏 iOS Library</a>
  </p>
  <p align="center">
    <a href="https://github.com/ionic-team/capacitor-file-transfer/issues/new?labels=bug&template=bug-report.md">🐛 Report Bug</a>
    ·
    <a href="https://github.com/ionic-team/capacitor-file-transfer/issues/new?labels=enhancement&template=feature-request.md">   💡 Request Feature</a>
  </p>
</div>

## Install

```bash
npm install @capacitor/file-transfer
npx cap sync
```

## Example

### Download

```typescript
import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory } from '@capacitor/filesystem';

// First get the full file path using Filesystem
const fileInfo = await Filesystem.getUri({
  directory: Directory.Data,
  path: 'downloaded-file.pdf'
});

try {
    // Then use the FileTransfer plugin to download
    await FileTransfer.downloadFile({
        url: 'https://example.com/file.pdf',
        path: fileInfo.uri,
        progress: true
    });
} catch(error) {
    // handle error - see `FileTransferError` interface for what error information is returned
}

// Progress events
FileTransfer.addListener('progress', (progress) => {
  console.log(`Downloaded ${progress.bytes} of ${progress.contentLength}`);
});
```

### Upload

```typescript
import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory } from '@capacitor/filesystem';

// First get the full file path using Filesystem
const fileInfo = await Filesystem.getUri({
  directory: Directory.Cache,
  path: 'image_upload.png'
});

try {
    // Then use the FileTransfer plugin to upload
    const result = await FileTransfer.downloadFile({
        url: 'https://example.com/upload_api',
        path: fileInfo.uri,
        chunkedMode: true,
        headers: {
            // Upload uses multipart form upload by default.
            // If you want to avoid that, you can set the 'Content-Type' header explicitly.
            'Content-Type': 'application/octet-stream',
        },
        progress: false
    });
    // get server response and other info from result - see `UploadFileResult` interface
} catch(error) {
    // handle error - see `FileTransferError` interface for what error information is returned
}
```

## Documentation

Refer to [this page](packages/capacitor-plugin/README.md).