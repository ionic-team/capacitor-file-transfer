// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorFileTransfer",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CapacitorFileTransfer",
            targets: ["FileTransferPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "7.1.0")
    ],
    targets: [
        .binaryTarget(
            name: "IONFileTransferLib",
            url: "https://github.com/ionic-team/ion-ios-filetransfer/releases/download/1.0.0/IONFileTransferLib.zip",
            checksum: "59f5bbf1c7dfe5c5f872ad4d10a0bd0b8e57bd21cf18ff8ac68e9c4a65ec3c1e" // sha-256
        ),
        .target(
            name: "FileTransferPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                "IONFileTransferLib"
            ],
            path: "ios/Sources/FileTransferPlugin"),
        .testTarget(
            name: "FileTransferPluginTests",
            dependencies: ["FileTransferPlugin"],
            path: "ios/Tests/FileTransferPluginTests")
    ]
)
