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
