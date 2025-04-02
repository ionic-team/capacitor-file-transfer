package com.capacitorjs.plugins.filetransfer

import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import io.ionic.libs.ionfiletransferlib.IONFLTRController
import io.ionic.libs.ionfiletransferlib.model.IONFLTRDownloadOptions
import io.ionic.libs.ionfiletransferlib.model.IONFLTRTransferHttpOptions
import io.ionic.libs.ionfiletransferlib.model.IONFLTRTransferResult
import io.ionic.libs.ionfiletransferlib.model.IONFLTRUploadOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "FileTransfer")
class FileTransferPlugin : Plugin() {

    private val ioScope: CoroutineScope by lazy { CoroutineScope(Dispatchers.IO) }
    private val controller: IONFLTRController by lazy { IONFLTRController() }
    private lateinit var context: Context

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
            map[key] = getString(key) ?: ""
        }
        return map
    }

    private fun JSObject.toParamsMap(): Map<String, Array<String>> {
        val map = mutableMapOf<String, Array<String>>()
        keys().forEach { key ->
            val value = getString(key)
            if (value != null) {
                map[key] = arrayOf(value)
            }
        }
        return map
    }

    @PluginMethod
    fun downloadFile(call: PluginCall) {
        val url = call.getString("url") ?: run {
            call.reject("URL is required")
            return
        }
        val relativePath = call.getString("path") ?: run {
            call.reject("Path is required")
            return
        }
        val progress = call.getBoolean("progress", false) ?: false

        val headers = call.getObject("headers") ?: JSObject()
        val params = call.getObject("params") ?: JSObject()

        val httpOptions = IONFLTRTransferHttpOptions(
            method = call.getString("method") ?: "GET",
            headers = headers.toMap(),
            params = params.toParamsMap(),
            shouldEncodeUrlParams = call.getBoolean("shouldEncodeUrlParams", true) ?: true,
            readTimeout = call.getInt("readTimeout", 60000) ?: 60000,
            connectTimeout = call.getInt("connectTimeout", 60000) ?: 60000,
            disableRedirects = call.getBoolean("disableRedirects", false) ?: false
        )

        val options = IONFLTRDownloadOptions(
            url = url,
            filePath = relativePath,
            httpOptions = httpOptions
        )

        ioScope.launch {
            controller.downloadFile(options)
                .onEach { result ->
                    when (result) {
                        is IONFLTRTransferResult.Ongoing -> {
                            if (progress) {
                                val progressData = JSObject().apply {
                                    put("type", "download")
                                    put("url", url)
                                    put("bytes", result.status.bytes)
                                    put("contentLength", result.status.contentLength)
                                    put("lengthComputable", result.status.lengthComputable)
                                }
                                notifyListeners("progress", progressData)
                            }
                        }
                        is IONFLTRTransferResult.Complete -> {
                            val response = JSObject().apply {
                                put("path", relativePath)
                            }
                            call.resolve(response)
                        }
                    }
                }
                .catch { error ->
                    call.reject(error.message ?: "Unknown error occurred")
                }
                .collect{}
        }
    }

    @PluginMethod
    fun uploadFile(call: PluginCall) {
        val url = call.getString("url") ?: run {
            call.reject("URL is required")
            return
        }
        val relativePath = call.getString("path") ?: run {
            call.reject("Path is required")
            return
        }

        val progress = call.getBoolean("progress", false) ?: false
        val chunkedMode = call.getBoolean("chunkedMode", false) ?: false
        val mimeType = call.getString("mimeType")
        val fileKey = call.getString("fileKey") ?: "file"

        val headers = call.getObject("headers") ?: JSObject()
        val params = call.getObject("params") ?: JSObject()

        val httpOptions = IONFLTRTransferHttpOptions(
            method = call.getString("method") ?: "POST",
            headers = headers.toMap(),
            params = params.toParamsMap(),
            shouldEncodeUrlParams = call.getBoolean("shouldEncodeUrlParams", true) ?: true,
            readTimeout = call.getInt("readTimeout", 60000) ?: 60000,
            connectTimeout = call.getInt("connectTimeout", 60000) ?: 60000,
            disableRedirects = call.getBoolean("disableRedirects", false) ?: false
        )

        val options = IONFLTRUploadOptions(
            url = url,
            filePath = relativePath,
            chunkedMode = chunkedMode,
            mimeType = mimeType,
            fileKey = fileKey,
            httpOptions = httpOptions
        )

        ioScope.launch {
            controller.uploadFile(options)
                .onEach { result ->
                    when (result) {
                        is IONFLTRTransferResult.Ongoing -> {
                            if (progress) {
                                val progressData = JSObject().apply {
                                    put("type", "upload")
                                    put("url", url)
                                    put("bytes", result.status.bytes)
                                    put("contentLength", result.status.contentLength)
                                    put("lengthComputable", result.status.lengthComputable)
                                }
                                notifyListeners("progress", progressData)
                            }
                        }
                        is IONFLTRTransferResult.Complete -> {
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
                    call.reject(error.message ?: "Unknown error occurred")
                }
                .collect{}
        }
    }
}