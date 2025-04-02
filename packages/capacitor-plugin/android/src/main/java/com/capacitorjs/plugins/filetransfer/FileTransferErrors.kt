package com.capacitorjs.plugins.filetransfer

import io.ionic.libs.ionfiletransferlib.model.IONFLTRException

object FileTransferErrors {
    private fun formatErrorCode(number: Int): String {
        return "OS-PLUG-FLTR-" + number.toString().padStart(4, '0')
    }

    data class ErrorInfo(
        val code: String,
        val message: String
    )

    val cordovaNotDefined = ErrorInfo(
        code = formatErrorCode(1),
        message = "Cordova / Capacitor isn't defined."
    )

    val oldPluginVersion = ErrorInfo(
        code = formatErrorCode(2),
        message = "The app is running with an old version of the plugin. Please create a new mobile package."
    )

    val pluginNotDefined = ErrorInfo(
        code = formatErrorCode(3),
        message = "The File Transfer plugin is not defined. Make sure the mobile package is valid."
    )

    val bridgeNotInitialized = ErrorInfo(
        code = formatErrorCode(4),
        message = "Cordova / Capacitor bridge isn't initialized."
    )

    val invalidParameters = ErrorInfo(
        code = formatErrorCode(5),
        message = "The method's input parameters aren't valid."
    )

    fun invalidServerUrl(url: String) = if (url.isBlank()) {
        urlEmpty
    } else {
        ErrorInfo(
            code = formatErrorCode(6),
            message = "Invalid server URL was provided - $url"
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
        message = "The server responded with HTTP 304 – Not Modified. If you want to avoid this, check your headers related to HTTP caching."
    )

    val genericError = ErrorInfo(
        code = formatErrorCode(11),
        message = "The operation failed with an error."
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
    is IONFLTRException.CannotCreateDirectory -> FileTransferErrors.genericError
    is IONFLTRException.HttpError -> if (responseCode == "304") FileTransferErrors.notModified else FileTransferErrors.genericError
    is IONFLTRException.ConnectionError -> FileTransferErrors.connectionError
    is IONFLTRException.TransferError -> FileTransferErrors.genericError
    is IONFLTRException.UnknownError -> FileTransferErrors.genericError
    else -> FileTransferErrors.genericError
}