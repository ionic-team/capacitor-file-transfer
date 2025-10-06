// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorFileTransfer",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorFileTransfer",
            targets: ["FileTransferPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0"),
        .package(url: "https://github.com/ionic-team/ion-ios-filetransfer.git", from: "1.0.1")
    ],
    targets: [
        .target(
            name: "FileTransferPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "IONFileTransferLib", package: "ion-ios-filetransfer")
            ],
            path: "ios/Sources/FileTransferPlugin"),
        .testTarget(
            name: "FileTransferPluginTests",
            dependencies: ["FileTransferPlugin"],
            path: "ios/Tests/FileTransferPluginTests")
    ]
)
