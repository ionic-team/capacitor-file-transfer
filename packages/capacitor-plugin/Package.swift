// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorFileTransfer",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CapacitorFileTransfer",
            targets: ["FileTransferPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .binaryTarget(
            name: "IONFileTransferLib",
            url: "https://github.com/ionic-team/ion-ios-filetransfer/releases/download/1.0.1/IONFileTransferLib.zip",
            checksum: "0a239f814fa3746f68850246855d974c9795f60342897413212b2b46690f70d5" // sha-256
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
