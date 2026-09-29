// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapgoCapacitorPermissions",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapgoCapacitorPermissions",
            targets: ["PermissionsPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "PermissionsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/PermissionsPlugin"),
        .testTarget(
            name: "PermissionsPluginTests",
            dependencies: ["PermissionsPlugin"],
            path: "ios/Tests/PermissionsPluginTests")
    ]
)
