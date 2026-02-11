## [1.0.10](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.9...v1.0.10) (2026-02-11)


### Bug Fixes

* Align HTTP error message ([#55](https://github.com/ionic-team/capacitor-file-transfer/issues/55)) ([d50c7d6](https://github.com/ionic-team/capacitor-file-transfer/commit/d50c7d68046f2afe4295d81987eeb13514952b7b))
* **android:** Correctly returning headers for upload ([#46](https://github.com/ionic-team/capacitor-file-transfer/issues/46)) ([93eab42](https://github.com/ionic-team/capacitor-file-transfer/commit/93eab427d0d041adf7bdc09c7cf6dcc00acd93c3))
* **ios:** http body in error and send progress only when success ([#59](https://github.com/ionic-team/capacitor-file-transfer/issues/59)) ([d0e43cc](https://github.com/ionic-team/capacitor-file-transfer/commit/d0e43ccf611bd54b507953af634ee1d354203eac)) (indirectly fixes [#58](https://github.com/ionic-team/capacitor-file-transfer/issues/58))
* **ios:** Send upload response code as string instead of number ([#49](https://github.com/ionic-team/capacitor-file-transfer/issues/49)) ([ba0c1d2](https://github.com/ionic-team/capacitor-file-transfer/commit/ba0c1d21913118579cc48f7b60685592c745baa9))
* **web:** Check the existence of the folder before mkdir. ([#33](https://github.com/ionic-team/capacitor-file-transfer/issues/33)) ([58ea4b6](https://github.com/ionic-team/capacitor-file-transfer/commit/58ea4b682ce9fd607a8fbf1065ec244cc7cae997))

## [1.0.9](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.8...v1.0.9) (2026-01-14)


### Bug Fixes

* **android:** Upload with params ([#51](https://github.com/ionic-team/capacitor-file-transfer/issues/51)) ([dc9ac37](https://github.com/ionic-team/capacitor-file-transfer/commit/dc9ac37074cc3044f6ab9170b34078c98e7345d8))

## [1.0.8](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.7...v1.0.8) (2025-12-22)


### Bug Fixes

* **android:** correct upload response by removing gzip encoding ([#45](https://github.com/ionic-team/capacitor-file-transfer/issues/45)) ([12b9631](https://github.com/ionic-team/capacitor-file-transfer/commit/12b9631850483760b8321a12afdcd48e63d3e179))

## [1.0.7](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.6...v1.0.7) (2025-12-16)


### Bug Fixes

* Use latest-7 for 1.x docs ([#44](https://github.com/ionic-team/capacitor-file-transfer/issues/44)) ([6822561](https://github.com/ionic-team/capacitor-file-transfer/commit/682256121ff7748d5c129f6c034693becae48a17))

## [1.0.6](https://github.com/ionic-team/capacitor-file-transfer/compare/v1.0.5...v1.0.6) (2025-10-06)


### Bug Fixes

* **ios:** Simplify SPM usage for native library ([#28](https://github.com/ionic-team/capacitor-file-transfer/issues/28)) ([0b2f319](https://github.com/ionic-team/capacitor-file-transfer/commit/0b2f319427d5565f5e08dfe98059859297a3418d))

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
