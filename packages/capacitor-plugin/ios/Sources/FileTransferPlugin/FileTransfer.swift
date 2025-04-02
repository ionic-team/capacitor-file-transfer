import Foundation

@objc public class FileTransfer: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}
