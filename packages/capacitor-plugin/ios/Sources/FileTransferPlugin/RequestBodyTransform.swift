import Capacitor
import IONFileTransferLib

// Basically a reimplementation of certain parts of CapacitorUrlRequest
// that does not need to be used with the latter.

public enum RequestBodyError: Error {
    case serializationError(String?)
}

public struct RequestData {
    let body: Data
    let additionalHeaders: [String: String]
    
    init(body: Data) {
        self.body = body
        self.additionalHeaders = [:]
    }
    init(body: Data, additionalHeaders: [String: String]) {
        self.body = body
        self.additionalHeaders = additionalHeaders
    }
}

public func getRequestData(
    call: CAPPluginCall,
    options: inout IONFLTRHttpOptions
) throws -> Data? {
    guard let body = call.options["data"] as? JSValue else {
        return nil
    }
    let bodyType = call.getString("dataType")
    guard let contentType = options.headers["Content-Type"] else {
        return nil
    }
    guard let reqData = try getRequestData(body, contentType, bodyType) else {
        return nil
    }
    
    options.headers.merge(reqData.additionalHeaders, uniquingKeysWith: { _, new in new })
    
    return reqData.body
}

public func getRequestData(
    _ body: JSValue,
    _ contentType: String,
    _ dataType: String? = nil
) throws -> RequestData? {
    if dataType == "file" {
        guard let stringData = body as? String else {
            throw RequestBodyError.serializationError(
                "[ data ] argument could not be parsed as string"
            )
        }
        guard let data = Data(base64Encoded: stringData) else {return nil}
        return RequestData(body: data)
    } else if dataType == "formData" {
        return try getRequestDataFromFormData(body, contentType)
    }

    // If data can be parsed directly as a string, return that without processing.
    if let strVal = try? getRequestDataAsString(body) {
        return strVal
    } else if contentType.contains("application/json") {
        return try getRequestDataAsJson(body)
    } else if contentType.contains("application/x-www-form-urlencoded") {
        return try getRequestDataAsFormUrlEncoded(body)
    } else if contentType.contains("multipart/form-data") {
        return try getRequestDataAsMultipartFormData(body, contentType)
    } else {
        throw RequestBodyError.serializationError(
            "[ data ] argument could not be parsed for content type [ \(contentType) ]"
        )
    }
}

public func getRequestDataAsString(_ data: JSValue) throws -> RequestData {
    guard let stringData = data as? String else {
        throw RequestBodyError.serializationError(
            "[ data ] argument could not be parsed as string"
        )
    }
    return RequestData(body: Data(stringData.utf8))
}

public func getRequestDataFromFormData(_ data: JSValue, _ contentType: String)
    throws -> RequestData?
{
    guard let list = data as? JSArray else {
        // Throw, other data types explicitly not supported.
        throw RequestBodyError.serializationError(
            "Data must be an array for FormData"
        )
    }
    var requestHeaders: [String: String] = [:]
    var data = Data()
    var boundary = UUID().uuidString
    if contentType.contains("="),
        let contentBoundary = contentType.components(separatedBy: "=").last
    {
        boundary = contentBoundary
    } else {
        let contentType = "multipart/form-data; boundary=\(boundary)"
        requestHeaders["Content-Type"] = contentType
    }
    for entry in list {
        guard let item = entry as? [String: String] else {
            throw RequestBodyError.serializationError(
                "Data must be an array for FormData"
            )
        }

        let type = item["type"]
        let key = item["key"]
        let value = item["value"]!

        if type == "base64File" {
            let fileName = item["fileName"]
            let fileContentType = item["contentType"]

            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append(
                "Content-Disposition: form-data; name=\"\(key!)\"; filename=\"\(fileName!)\"\r\n"
                    .data(using: .utf8)!
            )
            data.append(
                "Content-Type: \(fileContentType!)\r\n".data(using: .utf8)!
            )
            data.append(
                "Content-Transfer-Encoding: binary\r\n".data(using: .utf8)!
            )
            data.append("\r\n".data(using: .utf8)!)

            data.append(Data(base64Encoded: value)!)

            data.append("\r\n".data(using: .utf8)!)
        } else if type == "string" {
            data.append("--\(boundary)\r\n".data(using: .utf8)!)
            data.append(
                "Content-Disposition: form-data; name=\"\(key!)\"\r\n".data(
                    using: .utf8
                )!
            )
            data.append("\r\n".data(using: .utf8)!)
            data.append(value.data(using: .utf8)!)
            data.append("\r\n".data(using: .utf8)!)
        }
    }
    data.append("--\(boundary)--\r\n".data(using: .utf8)!)

    return RequestData.init(body: data, additionalHeaders: requestHeaders)
}

public func getRequestDataAsJson(_ data: JSValue) throws -> RequestData? {
    // We need to check if the JSON is valid before attempting to serialize, as JSONSerialization.data will not throw an exception that can be caught, and will cause the application to crash if it fails.
    if JSONSerialization.isValidJSONObject(data) {
        return RequestData(body: try JSONSerialization.data(withJSONObject: data))
    } else {
        throw RequestBodyError.serializationError("[ data ] argument for request of content-type [ application/json ] must be serializable to JSON")
    }
}

public func getRequestDataAsFormUrlEncoded(_ data: JSValue) throws -> RequestData? {
        var components = URLComponents()
        components.queryItems = []

        guard let obj = data as? JSObject else {
            // Throw, other data types explicitly not supported
            throw RequestBodyError.serializationError("[ data ] argument for request with content-type [ multipart/form-data ] may only be a plain javascript object")
        }

        let allowed = CharacterSet(charactersIn: "-._*").union(.alphanumerics)

        obj.keys.forEach { (key: String) in
            let value = obj[key] as? String ?? ""
            components.queryItems?.append(URLQueryItem(name: key.addingPercentEncoding(withAllowedCharacters: allowed)?.replacingOccurrences(of: "%20", with: "+") ?? key, value: value.addingPercentEncoding(withAllowedCharacters: allowed)?.replacingOccurrences(of: "%20", with: "+")))
        }

        if components.query != nil {
            return RequestData(body: Data(components.query!.utf8))
        }

        return nil
    }

    public func getRequestDataAsMultipartFormData(_ data: JSValue, _ contentType: String) throws -> RequestData {
        guard let obj = data as? JSObject else {
            // Throw, other data types explicitly not supported.
            throw RequestBodyError.serializationError("[ data ] argument for request with content-type [ application/x-www-form-urlencoded ] may only be a plain javascript object")
        }
        
        var additionalHeaders: [String: String] = [:]

        let strings: [String: String] = obj.compactMapValues { any in
            any as? String
        }

        var data = Data()
        var boundary = UUID().uuidString
        if contentType.contains("="), let contentBoundary = contentType.components(separatedBy: "=").last {
            boundary = contentBoundary
        } else {
            let contentType = "multipart/form-data; boundary=\(boundary)"
            additionalHeaders["Content-Type"] = contentType
        }
        strings.forEach { key, value in
            data.append("\r\n--\(boundary)\r\n".data(using: .utf8)!)
            data.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            data.append(value.data(using: .utf8)!)
        }
        data.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        return RequestData(body: data, additionalHeaders: additionalHeaders)
    }
