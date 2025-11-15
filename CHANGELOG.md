# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Corrected `getPayment` endpoint from `/payments/:id` to `/sessions/:id`

## [0.1.0] - 2025-11-15

### Added
- Initial release of the Acoriss Payment Gateway SDK
- `createSession()` method to create payment sessions
- `getPayment()` method to retrieve payment status
- Support for sandbox and live environments
- HMAC-SHA256 signature generation for API requests
- Custom signer support for alternative signing algorithms
- Comprehensive error handling with `APIError` class
- TypeScript type definitions for all API requests and responses
- Complete test coverage (88%+) with Jest
- Pre-commit hooks with Husky and lint-staged
- GitHub repository integration

### Security
- Enforced js-yaml@^4.1.1 to address prototype pollution vulnerability (CVE)
