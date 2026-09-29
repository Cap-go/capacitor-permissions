import Foundation
import Capacitor
import UIKit

@objc(PermissionsPlugin)
public class PermissionsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PermissionsPlugin"
    public let jsName = "Permissions"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "check", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkMultiple", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestMultiple", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shouldShowRationale", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPreciseLocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]

    private let implementation = Permissions()

    @objc func check(_ call: CAPPluginCall) {
        guard let permission = call.getString("permission") else {
            call.reject("permission is required")
            return
        }
        implementation.check(permission) { status in
            call.resolve(["status": status.rawValue])
        }
    }

    @objc func request(_ call: CAPPluginCall) {
        guard let permission = call.getString("permission") else {
            call.reject("permission is required")
            return
        }
        implementation.request(permission) { status in
            call.resolve(["status": status.rawValue])
        }
    }

    @objc func checkMultiple(_ call: CAPPluginCall) {
        guard let permissions = call.getArray("permissions", String.self), !permissions.isEmpty else {
            call.reject("permissions is required")
            return
        }
        var statuses: [String: String] = [:]
        let group = DispatchGroup()
        for permission in permissions {
            group.enter()
            implementation.check(permission) { status in
                statuses[permission] = status.rawValue
                group.leave()
            }
        }
        group.notify(queue: .main) {
            call.resolve(["statuses": statuses])
        }
    }

    @objc func requestMultiple(_ call: CAPPluginCall) {
        guard let permissions = call.getArray("permissions", String.self), !permissions.isEmpty else {
            call.reject("permissions is required")
            return
        }
        var statuses: [String: String] = [:]
        func next(_ index: Int) {
            if index >= permissions.count {
                call.resolve(["statuses": statuses])
                return
            }
            let permission = permissions[index]
            implementation.request(permission) { status in
                statuses[permission] = status.rawValue
                next(index + 1)
            }
        }
        next(0)
    }

    @objc func shouldShowRationale(_ call: CAPPluginCall) {
        call.resolve(["shouldShow": false])
    }

    @objc func openSettings(_ call: CAPPluginCall) {
        let type = call.getString("type") ?? "application"
        DispatchQueue.main.async {
            let url: URL?
            if type == "notifications" {
                if #available(iOS 16.0, *) {
                    url = URL(string: UIApplication.openNotificationSettingsURLString)
                } else {
                    url = URL(string: UIApplication.openSettingsURLString)
                }
            } else {
                url = URL(string: UIApplication.openSettingsURLString)
            }
            guard let url else {
                call.reject("Unable to open settings")
                return
            }
            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Unable to open settings")
                }
            }
        }
    }

    @objc func requestPreciseLocation(_ call: CAPPluginCall) {
        implementation.requestPreciseLocation { status in
            call.resolve(["status": status.rawValue])
        }
    }

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve([
            "version": implementation.getPluginVersion()
        ])
    }
}
