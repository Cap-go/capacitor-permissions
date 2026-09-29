import Foundation

@objc public class Permissions: NSObject {
    @objc public func echo(_ value: String) -> String {
        return value
    }

    @objc public func getPluginVersion() -> String {
        return "native"
    }
}
