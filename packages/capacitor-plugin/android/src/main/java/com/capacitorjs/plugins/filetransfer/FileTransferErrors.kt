package com.capacitorjs.plugins.filetransfer

import com.getcapacitor.JSObject
import io.ionic.libs.ionfiletransferlib.model.IONFLTRException

object FileTransferErrors {
    fun formatErrorCode(number: Int): String {
        return "OS-PLUG-FLTR-" + number.toString().padStart(4, '0')
    }

    data class ErrorInfo(
        val code: String,
        val message: String,
        val source: String? = null,
        val target: String? = null,
        val httpStatus: Int? = null,
        val body: String? = null,
        val headers: Map<String, List<String>>? = null,
        val exception: String? = null
    ) {
        /**
         * Converts the ErrorInfo to a JSObject that can be passed to PluginCall.reject
         */
        fun toJSObject(): JSObject {
            return JSObject().apply {
                put("code", code)
                put("message", message)
                if (source != null) put("source", source)
                if (target != null) put("target", target)
                if (httpStatus != null) put("httpStatus", httpStatus)
                if (body != null) put("body", body)
                
                if (headers != null) {
                    val headersObj = JSObject()
                    headers.forEach { (key, values) ->
                        headersObj.put(key, values.firstOrNull() ?: "")
                    }
                    put("headers", headersObj)
                }
                
                if (exception != null) put("exception", exception)
            }
        }
    }

    val invalidParameters = ErrorInfo(
        code = formatErrorCode(5),
        message = "The method's input parameters aren't valid."
    )

    fun invalidServerUrl(url: String) = if (url.isBlank()) {
        urlEmpty
    } else {
        ErrorInfo(
            code = formatErrorCode(6),
            message = "Invalid server URL was provided - $url",
            source = url
        )
    }

    val permissionDenied = ErrorInfo(
        code = formatErrorCode(7),
        message = "Unable to perform operation, user denied permission request."
    )

    val fileDoesNotExist = ErrorInfo(
        code = formatErrorCode(8),
        message = "Operation failed because file does not exist."
    )

    val connectionError = ErrorInfo(
        code = formatErrorCode(9),
        message = "Failed to connect to server."
    )

    val notModified = ErrorInfo(
        code = formatErrorCode(10),
        message = "The server responded with HTTP 304 – Not Modified. If you want to avoid this, check your headers related to HTTP caching.",
        httpStatus = 304
    )
    
    fun httpError(responseCode: String, message: String, responseBody: String?, headers: Map<String, List<String>>?) = ErrorInfo(
        code = formatErrorCode(11),
        message = "HTTP error: $responseCode - $message",
        httpStatus = responseCode.toIntOrNull(),
        body = responseBody,
        headers = headers,
        exception = message
    )
    
    fun genericError(cause: Throwable) = ErrorInfo(
        code = formatErrorCode(12),
        message = "The operation failed with an error - ${cause.localizedMessage}",
        exception = cause.localizedMessage
    )

    val urlEmpty = ErrorInfo(
        code = formatErrorCode(6),
        message = "URL to connect to is either null or empty."
    )
}

fun Throwable.toFileTransferError(): FileTransferErrors.ErrorInfo = when (this) {
    is IONFLTRException.InvalidPath -> FileTransferErrors.invalidParameters
    is IONFLTRException.EmptyURL -> FileTransferErrors.urlEmpty
    is IONFLTRException.InvalidURL -> FileTransferErrors.invalidServerUrl(url)
    is IONFLTRException.FileDoesNotExist -> FileTransferErrors.fileDoesNotExist
    is IONFLTRException.CannotCreateDirectory -> FileTransferErrors.genericError(this)
    is IONFLTRException.HttpError -> {
        if (responseCode == "304") {
            FileTransferErrors.notModified
        } else {
            FileTransferErrors.httpError(responseCode, message, responseBody, headers)
        }
    }
    is IONFLTRException.ConnectionError -> FileTransferErrors.connectionError
    is IONFLTRException.TransferError -> FileTransferErrors.genericError(this)
    is IONFLTRException.UnknownError -> FileTransferErrors.genericError(this)
    is SecurityException -> FileTransferErrors.permissionDenied
    else -> FileTransferErrors.genericError(this)
}