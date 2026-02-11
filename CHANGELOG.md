## [2.0.4](https://github.com/ionic-team/capacitor-file-transfer/compare/v2.0.3...v2.0.4) (2026-02-10)


### Bug Fixes

* Align HTTP error message ([#55](https://github.com/ionic-team/capacitor-file-transfer/issues/55)) ([a1702d0](https://github.com/ionic-team/capacitor-file-transfer/commit/a1702d0e1a25cda539d9e5a73be3ee11bc594fab))
* **android:** AGP 9.0 no longer supporting `proguard-android.txt` ([#57](https://github.com/ionic-team/capacitor-file-transfer/issues/57)) ([2eea2f7](https://github.com/ionic-team/capacitor-file-transfer/commit/2eea2f76de74a5ed3c5e1643e7d56a847f561763))
* **ios:** http body in error and send progress only when success ([#59](https://github.com/ionic-team/capacitor-file-transfer/issues/59)) ([da7a5fd](https://github.com/ionic-team/capacitor-file-transfer/commit/da7a5fd5acc6f1a1331fedf433d0dff846cb5214)) (indirectly fixes [#58](https://github.com/ionic-team/capacitor-file-transfer/issues/58))
* **web:** Check the existence of the folder before mkdir. ([#33](https://github.com/ionic-team/capacitor-file-transfer/issues/33)) ([0f0658f](https://github.com/ionic-team/capacitor-file-transfer/commit/0f0658ffff5d89be468e5b9e7ee3e26cdb905c18))

## [2.0.3](https://github.com/ionic-team/capacitor-file-transfer/compare/v2.0.2...v2.0.3) (2026-01-14)


### Bug Fixes

* **android:** Upload with params ([#51](https://github.com/ionic-team/capacitor-file-transfer/issues/51)) ([035e71c](https://github.com/ionic-team/capacitor-file-transfer/commit/035e71cf1abec9a06d4fe03d478299b233400080))

## [2.0.2](https://github.com/ionic-team/capacitor-file-transfer/compare/v2.0.1...v2.0.2) (2026-01-02)


### Bug Fixes

* **android:** Correctly returning headers for upload ([#46](https://github.com/ionic-team/capacitor-file-transfer/issues/46)) ([1242b3b](https://github.com/ionic-team/capacitor-file-transfer/commit/1242b3b1bb4c5342f7dcb8a69db04a2a994ca321))
* **ios:** Send upload response code as string instead of number ([#49](https://github.com/ionic-team/capacitor-file-transfer/issues/49)) ([4c63c2a](https://github.com/ionic-team/capacitor-file-transfer/commit/4c63c2a58e992e15fae7d2b6b0726600042ef2b5))

## [2.0.1](https://github.com/ionic-team/capacitor-file-transfer/compare/v2.0.0...v2.0.1) (2025-12-22)


### Bug Fixes

* **android:** correct upload response by removing gzip encoding ([#45](https://github.com/ionic-team/capacitor-file-transfer/issues/45)) ([80218c5](https://github.com/ionic-team/capacitor-file-transfer/commit/80218c56179c749034e6fad3ad65b1f3ae4af6ff))

# [2.0.0](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.6...v2.0.0) (2025-12-08)


### Bug Fixes

* **android:** use 'propName = value' assignment syntax in build.gradle files ([4a2f8d4](https://github.com/ionic-team/capacitor-file-transfer/commit/4a2f8d445c96b198d0c73e277ca46a94ed175890))


### Features

* Capacitor 8 support ([ab2fa1b](https://github.com/ionic-team/capacitor-file-transfer/commit/ab2fa1bf1712ba784296e62a9722e02b6e48cd30))


### BREAKING CHANGES

* Capacitor major version update requires major version update on the plugin.

# [2.0.0-next.4](https://github.com/ionic-team/capacitor-file-transfer/compare/v2.0.0-next.3...v2.0.0-next.4) (2025-11-17)

* **android:** Update gradle dependencies to latest versions
* **ios:** Minor updates to Package.swift



# [2.0.0-next.3](https://github.com/ionic-team/capacitor-file-transfer/compare/v2.0.0-next.2...v2.0.0-next.3) (2025-11-10)


### Bug Fixes

* **android:** use 'propName = value' assignment syntax in build.gradle files ([4a2f8d4](https://github.com/ionic-team/capacitor-file-transfer/commit/4a2f8d445c96b198d0c73e277ca46a94ed175890))

# [2.0.0-next.2](https://github.com/ionic-team/capacitor-file-transfer/compare/v2.0.0-next.1...v2.0.0-next.2) (2025-10-06)


### Bug Fixes

* **ios:** Simplify SPM usage for native library ([#28](https://github.com/ionic-team/capacitor-file-transfer/issues/28)) ([0b2f319](https://github.com/ionic-team/capacitor-file-transfer/commit/0b2f319427d5565f5e08dfe98059859297a3418d))

## [1.0.6](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.5...v1.0.6) (2025-10-06)


### Bug Fixes

* **ios:** Simplify SPM usage for native library ([#28](https://github.com/ionic-team/capacitor-file-transfer/issues/28)) ([0b2f319](https://github.com/ionic-team/capacitor-file-transfer/commit/0b2f319427d5565f5e08dfe98059859297a3418d))

# [2.0.0-next.1](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.5...v2.0.0-next.1) (2025-09-09)


### Features

* Capacitor 8 support ([ab2fa1b](https://github.com/ionic-team/capacitor-file-transfer/commit/ab2fa1bf1712ba784296e62a9722e02b6e48cd30))


### BREAKING CHANGES

* Capacitor major version update requires major version update on the plugin.

## [1.0.5](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.4...v1.0.5) (2025-08-29)


### Bug Fixes

* **ios:** notify of upload progress ([#20](https://github.com/ionic-team/capacitor-file-transfer/issues/20)) ([9ae0712](https://github.com/ionic-team/capacitor-file-transfer/commit/9ae0712f065e91415385545e071dcbc4449258d0))

## [1.0.4](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.3...v1.0.4) (2025-08-22)


### Bug Fixes

* export package.json to fix cap sync issues ([#17](https://github.com/ionic-team/capacitor-file-transfer/issues/17)) ([ffc46f0](https://github.com/ionic-team/capacitor-file-transfer/commit/ffc46f0b8713e042e8772b2246729c363055d099))

## [1.0.3](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.2...v1.0.3) (2025-08-07)


### Bug Fixes

* **android:** upload with content URIs ([#14](https://github.com/ionic-team/capacitor-file-transfer/issues/14)) ([49f330f](https://github.com/ionic-team/capacitor-file-transfer/commit/49f330fa09f2d78fb453195a13e77aa1d1a81c32))


## [1.0.2](https://github.com/ionic-team/capacitor-file-transfer/compare/1.0.1...v1.0.2) (2025-07-31)

### Fixes

- **android**: normalize path before running public directory check ([#8](https://github.com/ionic-team/capacitor-file-transfer/pull/8))
- **ios**: Use capacitor-swift-pm from 7.0.0 instead of specific version ([#12](https://github.com/ionic-team/capacitor-file-transfer/pull/12))

## [1.0.1](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.0...1.0.1) (2025-06-30)

### Fixes

- Set dependency on @capacitor/synapse to 1.0.3 to fix ssr environments

## [1.0.0](https://github.com/ionic-team/capacitor-file-transfer/tree/v1.0.0) (2025-05-26)

### Features

- Implement plugin methods: `downloadFile` and `uploadFile`.
