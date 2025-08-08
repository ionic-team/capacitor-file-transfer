package com.capacitorjs.plugins.filetransfer

import android.Manifest
import android.content.Context
import android.media.MediaScannerConnection
import android.os.Build
import android.os.Environment
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import io.ionic.libs.ionfiletransferlib.IONFLTRController
import io.ionic.libs.ionfiletransferlib.model.IONFLTRDownloadOptions
import io.ionic.libs.ionfiletransferlib.model.IONFLTRProgressStatus
import io.ionic.libs.ionfiletransferlib.model.IONFLTRTransferHttpOptions
import io.ionic.libs.ionfiletransferlib.model.IONFLTRTransferResult
import io.ionic.libs.ionfiletransferlib.model.IONFLTRUploadOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import androidx.core.net.toUri

@CapacitorPlugin(
    name = "FileTransfer",
    permissions = [
        Permission(
            strings = [Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE],
            alias = "publicStorage"
        )
    ]
)
class FileTransferPlugin : Plugin() {

    companion object {
        const val PUBLIC_STORAGE = "publicStorage"
        private const val PROGRESS_UPDATE_INTERVAL = 100L // 100ms between progress updates
        private const val DEFAULT_TIMEOUT_MS = 60000 // Default timeout of 60 seconds
    }

    private val ioScope: CoroutineScope by lazy { CoroutineScope(Dispatchers.IO) }
    private val controller: IONFLTRController by lazy { IONFLTRController(context) }
    private lateinit var context: Context
    private var lastProgressUpdate = 0L

    override fun load() {
        super.load()
        context = bridge.context
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        ioScope.cancel()
    }

    private fun JSObject.toMap(): Map<String, String> {
        val map = mutableMapOf<String, String>()
        keys().forEach { key ->
            map[key] = getString(key).orEmpty()
        }
        return map
    }

    private fun JSObject.toParamsMap(): Map<String, Array<String>> {
        val map = mutableMapOf<String, Array<String>>()
        keys().forEach { key ->
            when (val value = opt(key)) {
                is String -> map[key] = arrayOf(value)
                is org.json.JSONArray -> {
                    val values = mutableListOf<String>()
                    for (i in 0 until value.length()) {
                        value.optString(i).takeIf { it.isNotEmpty() }?.let { values.add(it) }
                    }
                    if (values.isNotEmpty()) {
                        map[key] = values.toTypedArray()
                    }
                }
            }
        }
        return map
    }
    
    /**
     * Notify progress to listeners
     * Throttled to every 100ms to avoid excessive callbacks
     * 
     * @param transferType The type of transfer ("download" or "upload")
     * @param url The URL of the file being transferred
     * @param status The status of the transfer containing bytes, contentLength, etc.
     * @param forceUpdate If true, sends the update regardless of throttling
     */
    private fun notifyProgress(transferType: String, url: String, status: IONFLTRProgressStatus, forceUpdate: Boolean = false) {
        val currentTime = System.currentTimeMillis()
        if (forceUpdate || currentTime - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL) {
            val progressData = JSObject().apply {
                put("type", transferType)
                put("url", url)
                put("bytes", status.bytes)
                put("contentLength", status.contentLength)
                put("lengthComputable", status.lengthComputable)
            }
            notifyListeners("progress", progressData)
            lastProgressUpdate = currentTime
        }
    }

    /**
     * Creates HTTP options for transfer operations based on plugin call parameters
     *
     * @param call The plugin call containing HTTP options
     * @param defaultMethod The default HTTP method to use if not specified in the call
     * @return Configured HTTP options for the transfer operation
     */
    private fun createHttpOptions(call: PluginCall, defaultMethod: String): IONFLTRTransferHttpOptions {
        val headers = call.getObject("headers") ?: JSObject()
        val params = call.getObject("params") ?: JSObject()
        
        return IONFLTRTransferHttpOptions(
            method = call.getString("method") ?: defaultMethod,
            headers = headers.toMap(),
            params = params.toParamsMap(),
            shouldEncodeUrlParams = call.getBoolean("shouldEncodeUrlParams", true) ?: true,
            readTimeout = call.getInt("readTimeout", DEFAULT_TIMEOUT_MS) ?: DEFAULT_TIMEOUT_MS,
            connectTimeout = call.getInt("connectTimeout", DEFAULT_TIMEOUT_MS) ?: DEFAULT_TIMEOUT_MS,
            disableRedirects = call.getBoolean("disableRedirects", false) ?: false
        )
    }

    @PluginMethod
    fun downloadFile(call: PluginCall) {
        val url = call.getString("url") ?: run {
            call.sendError(FileTransferErrors.invalidParameters, "URL is required")
            return
        }
        val filePath = call.getString("path") ?: run {
            call.sendError(FileTransferErrors.invalidParameters, "Path is required")
            return
        }

        // Check for storage permissions before proceeding
        if (!isStoragePermissionGranted()) {
            requestAllPermissions(call, "permissionCallback")
            return
        }

        val progress = call.getBoolean("progress", false) ?: false
        val httpOptions = createHttpOptions(call, "GET")

        val options = IONFLTRDownloadOptions(
            url = url,
            filePath = filePath,
            httpOptions = httpOptions
        )

        controller.downloadFile(options)
            .onEach { result ->
                when (result) {
                    is IONFLTRTransferResult.Ongoing -> {
                        if (progress) {
                            notifyProgress("download", url, result.status)
                        }
                    }
                    is IONFLTRTransferResult.Complete -> {
                        // Send a final progress update with 100% completion
                        if (progress) {
                            val contentLength = result.data.totalBytes
                            val finalStatus = IONFLTRProgressStatus(
                                bytes = contentLength,
                                contentLength = contentLength,
                                lengthComputable = true
                            )
                            notifyProgress("download", url, finalStatus, forceUpdate = true)
                        }
                        
                        // Update MediaStore if the file is in a public directory
                        if (isPublicDirectory(filePath)) {
                            MediaScannerConnection.scanFile(context, arrayOf(filePath), null, null)
                        }
                        
                        val response = JSObject().apply {
                            put("path", filePath)
                        }
                        call.resolve(response)
                    }
                }
            }
            .catch { error ->
                val errorInfo = error.toFileTransferError().copy(
                    source = url,
                    target = filePath
                )
                call.sendError(errorInfo)
            }
            .launchIn(ioScope)
    }

    @PluginMethod
    fun uploadFile(call: PluginCall) {
        val url = call.getString("url") ?: run {
            call.sendError(FileTransferErrors.invalidParameters, "URL is required")
            return
        }
        val filePath = call.getString("path") ?: run {
            call.sendError(FileTransferErrors.invalidParameters, "Path is required")
            return
        }

        // Check for storage permissions before proceeding
        if (!isStoragePermissionGranted()) {
            requestAllPermissions(call, "permissionCallback")
            return
        }

        val progress = call.getBoolean("progress", false) ?: false
        val chunkedMode = call.getBoolean("chunkedMode", false) ?: false
        val mimeType = call.getString("mimeType")
        val fileKey = call.getString("fileKey") ?: "file"
        
        val httpOptions = createHttpOptions(call, "POST")

        val options = IONFLTRUploadOptions(
            url = url,
            filePath = filePath,
            chunkedMode = chunkedMode,
            mimeType = mimeType,
            fileKey = fileKey,
            httpOptions = httpOptions
        )

        controller.uploadFile(options)
            .onEach { result ->
                when (result) {
                    is IONFLTRTransferResult.Ongoing -> {
                        if (progress) {
                            notifyProgress("upload", url, result.status)
                        }
                    }
                    is IONFLTRTransferResult.Complete -> {
                        // Send a final progress update with 100% completion
                        if (progress) {
                            val contentLength = result.data.totalBytes
                            val finalStatus = IONFLTRProgressStatus(
                                bytes = contentLength,
                                contentLength = contentLength,
                                lengthComputable = true
                            )
                            notifyProgress("upload", url, finalStatus, forceUpdate = true)
                        }
                        
                        val response = JSObject().apply {
                            put("bytesSent", result.data.totalBytes)
                            put("responseCode", result.data.responseCode)
                            put("response", result.data.responseBody)
                            put("headers", result.data.headers)
                        }
                        call.resolve(response)
                    }
                }
            }
            .catch { error ->
                val errorInfo = error.toFileTransferError().copy(
                    source = filePath,
                    target = url
                )
                call.sendError(errorInfo)
            }
            .launchIn(ioScope)
    }

    /**
     * Permission callback for when the user responds to permission requests
     */
    @PermissionCallback
    private fun permissionCallback(call: PluginCall) {
        if (!isStoragePermissionGranted()) {
            val errorInfo = FileTransferErrors.permissionDenied.copy(
                source = if (call.methodName == "uploadFile") call.getString("path") else call.getString("url"),
                target = if (call.methodName == "uploadFile") call.getString("url") else call.getString("path")
            )
            call.sendError(errorInfo)
            return
        }

        when (call.methodName) {
            "downloadFile" -> downloadFile(call)
            "uploadFile" -> uploadFile(call)
        }
    }

    /**
     * Extension function for PluginCall to send an error with the appropriate format
     * @param error The ErrorInfo containing error details
     * @param customMessage Optional custom message to override the error's default message
     */
    private fun PluginCall.sendError(error: FileTransferErrors.ErrorInfo, customMessage: String? = null) {
        val errorObject = error.toJSObject()
        if (customMessage != null) {
            // Override the default message if a custom one is provided
            errorObject.put("message", customMessage)
            this.reject(customMessage, error.code, errorObject)
        } else {
            this.reject(error.message, error.code, errorObject)
        }
    }

    /**
     * Checks if the storage permission is granted
     * @return Returns true if the app is running on Android 30 or newer or if the permission is already granted
     * or false if it is denied.
     */
    private fun isStoragePermissionGranted(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R || getPermissionState(PUBLIC_STORAGE) == PermissionState.GRANTED
    }

    /**
     * Checks if the file path is in a public directory (not in app-specific directories)
     * @param filePath The file path to check
     * @return Returns true if the file path is in a public directory
     */
    private fun isPublicDirectory(filePath: String): Boolean {
        // Normalize to path if it is a uri path
        val normalizedPath = filePath.toUri().path ?: filePath

        // Check if the path is in external storage
        val externalStoragePath = Environment.getExternalStorageDirectory().absolutePath

        // Get package directory paths
        val appPrivatePaths = listOf(
            context.filesDir.absolutePath,
            context.cacheDir.absolutePath,
            context.getExternalFilesDir(null)?.absolutePath,
            context.externalCacheDir?.absolutePath
        )

        // Check if path is in external storage but not in app-specific directories
        return normalizedPath.startsWith(externalStoragePath) &&
               appPrivatePaths.none { it != null && normalizedPath.startsWith(it) }
    }
}