// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorFileTransfer",
    platforms: [.iOS(.v16)],
    products: [
        .library(
            name: "CapacitorFileTransfer",
            targets: ["FileTransferPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor.git", from: "9.0.0-alpha.7"),
        .package(url: "https://github.com/ionic-team/ion-ios-filetransfer.git", from: "1.0.2")
    ],
    targets: [
        .target(
            name: "FileTransferPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor"),
                .product(name: "IONFileTransferLib", package: "ion-ios-filetransfer")
            ],
            path: "ios/Sources/FileTransferPlugin"),
        .testTarget(
            name: "FileTransferPluginTests",
            dependencies: ["FileTransferPlugin"],
            path: "ios/Tests/FileTransferPluginTests")
    ]
)
