# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-12-16

### Added
- **serviceId**: Optional string field to categorize payments
  - Added `serviceId?: string` to `PaymentSessionRequest` interface
  - Added `serviceId?: string` to `PaymentSessionResponse` interface
  - Added `serviceId?: string` to `RetrievePaymentResponse` interface
  - Enables payment categorization for better organization and reporting
  - Fully backward compatible - existing code continues to work unchanged
- Comprehensive test coverage for serviceId feature
- Documentation and examples for serviceId usage patterns

## [0.1.3] - 2025-12-09

### Fixed
- **BREAKING:** Fixed signature generation to properly use `HMAC-SHA256(body, apiSecret)` instead of incorrectly signing the secret itself
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
