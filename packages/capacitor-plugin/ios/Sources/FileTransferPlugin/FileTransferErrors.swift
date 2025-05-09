import Foundation
import Capacitor
import IONFileTransferLib

/// A structured error type used in file transfer operations.
///
/// `FileTransferError` represents various error states that can occur during file uploads and downloads,
/// including validation issues, connection problems, HTTP response errors, and file system errors.
struct FileTransferError: Error {
    
    /// A  error code in the format `OS-PLUG-FLTR-XXXX`.
    let code: String
    
    /// A human-readable error message.
    let message: String
    
    /// The source URL or path related to the error, if available.
    var source: String?

    /// The target URL or path related to the error, if available.
    var target: String?

    /// The HTTP status code, if the error is related to a network response.
    let httpStatus: Int?

    /// The response body returned by the server, if any.
    let body: String?

    /// The response headers returned by the server, if any.
    let headers: [String: String]?

    /// The underlying error that caused this error, if any.
    let cause: Error?

    /// Creates a new `FileTransferError` with the given values.
    ///
    /// - Parameters:
    ///   - code: A numeric code that will be formatted internally.
    ///   - message: A human-readable message describing the error.
    ///   - source: The original input source, such as a URL or path.
    ///   - target: The intended destination, such as a URL or path.
    ///   - httpStatus: Optional HTTP status code if error was a network response.
    ///   - body: Optional response body.
    ///   - headers: Optional response headers.
    ///   - cause: Optional underlying error.
    init(
        code: Int,
        message: String,
        source: String? = nil,
        target: String? = nil,
        httpStatus: Int? = nil,
        body: String? = nil,
        headers: [String: String]? = nil,
        cause: Error? = nil
    ) {
        self.code = String(format: "OS-PLUG-FLTR-%04d", code)
        self.message = message
        self.source = source
        self.target = target
        self.httpStatus = httpStatus
        self.body = body
        self.headers = headers
        self.cause = cause
    }
    
    /// A dictionary representation of the error for use in JavaScript or other serialization contexts.
    ///
    /// This includes the code, message, and optional metadata such as HTTP status,
    /// headers, body, and exception description.
    var errorInfo: JSObject {
        var info: JSObject = [
            "code": code,
            "message": message
        ]
        if let httpStatus = httpStatus { info["httpStatus"] = httpStatus }
        if let body = body { info["body"] = body }
        if let headers = headers {
            let headersObj: JSObject = headers.reduce(into: [:]) { result, pair in
                result[pair.key] = pair.value
            }
            info["headers"] = headersObj
        }
        if let cause = cause { info["exception"] = cause.localizedDescription }

        return info
    }
}

// MARK: - Static Constructors

extension FileTransferError {
    
    static func invalidParameters(_ message: String? = nil) -> FileTransferError {
        .init(code: 4, message: message ?? "The method's input parameters aren't valid.")
    }
    
    static func invalidServerUrl(_ url: String?) -> FileTransferError {
        .init(
            code: 5,
            message: (url?.isEmpty ?? true)
                ? "URL to connect to is either null or empty."
                : "Invalid server URL was provided - \(url!)",
            source: url
        )
    }
    
    static func fileDoesNotExist() -> FileTransferError {
        .init(code: 7, message: "Operation failed because file does not exist.")
    }

    static func connectionError() -> FileTransferError {
        .init(code: 8, message: "Failed to connect to server.")
    }
    
    static func notModified() -> FileTransferError {
        .init(
            code: 9,
            message: "The server responded with HTTP 304 – Not Modified. If you want to avoid this, check your headers related to HTTP caching.",
            httpStatus: 304
        )
    }
    
    static func httpError(
        responseCode: Int,
        message: String,
        responseBody: String? = nil,
        headers: [String: String]? = nil,
        cause: Error? = nil
    ) -> FileTransferError {
        .init(
            code: 10,
            message: "HTTP error: \(responseCode) - \(message)",
            httpStatus: responseCode,
            body: responseBody,
            headers: headers,
            cause: cause
        )
    }
    
    static func genericError(
        cause: Error? = nil
    ) -> FileTransferError {
        .init(
            code: 11,
            message: "The operation failed with an error.",
            cause: cause
        )
    }
}

// MARK: - IONFLTRException Mapping

extension IONFLTRException {
    
    /// Converts an `IONFLTRException` to a corresponding `FileTransferError`.
    ///
    /// This method maps specific cases of `IONFLTRException` to their
    /// equivalent `FileTransferError` cases, providing a unified error
    /// representation for file transfer operations.
    ///
    /// - Returns: A `FileTransferError` instance representing the exception.
    func toFileTransferError() -> FileTransferError {
        switch self {
        case .invalidPath:
            return FileTransferError.invalidParameters()
        case .emptyURL:
            return FileTransferError.invalidServerUrl(nil)
        case .invalidURL(let url):
            return FileTransferError.invalidServerUrl(url)
        case .fileDoesNotExist:
            return FileTransferError.fileDoesNotExist()
        case .cannotCreateDirectory:
            return FileTransferError.genericError(cause: self)
        case .httpError(let responseCode, let responseBody, let headers):
            return responseCode == 304
            ? FileTransferError.notModified()
            : FileTransferError.httpError(
                responseCode: responseCode,
                message: self.description,
                responseBody: responseBody,
                headers: headers,
                cause: self
            )
        case .connectionError:
            return FileTransferError.connectionError()
        case .transferError:
            return FileTransferError.genericError(cause: self)
        case .unknownError:
            return FileTransferError.genericError(cause: self)
        }
    }
}
