# Architecture

## Overview

This system is organized according to Clean Architecture and Domain-Driven Design (DDD) principles. The architecture enforces a clear separation of concerns, encourages testable business logic, and isolates infrastructure from domain logic.

## Design Principles

The architecture follows several key principles:

- Clean Architecture defines the project structure.
- Domain-Driven Design is used to model business rules.
- SOLID principles guide implementation details:
- Dependencies flow inward; outer layers depend on inner ones.
- Infrastructure concerns are abstracted behind interfaces.
- Business logic is isolated and independently testable.

## Layered Structure

### Interfaces

The interface layer defines entry points into the system. This includes HTTP controllers and any other input adapters. It delegates requests to the application layer. Interface code is located under `src/interfaces`.

### Application

The application layer coordinates workflows. It interprets user or system input, parses intent, and routes execution to the appropriate domain handlers. It does not contain business logic itself. This logic is implemented in `src/application`.

### Domain

The domain layer encapsulates core business rules and logic. This includes entities, value objects, handlers, and strategies. The domain is independent of frameworks and implementation details. Code in this layer is defined under `src/domain`.

### Infrastructure

The infrastructure layer implements connectivity to external systems, such as LND. It includes adapters, gateways, and factories responsible for instantiating dependencies. This code is located in `src/infrastructure`.

### Core

The core layer contains shared utilities and system-wide concerns. This includes environment configuration, logging, error sanitization, and schema validation. Core logic is defined in `src/core`.

#### Security: Log Sanitization

The system employs a pattern-based approach to redact sensitive information in logs and error messages:

- Sensitive fields are identified based on common naming patterns (defined in `SENSITIVE_FIELD_PATTERNS`)
- All connection types (LND-direct, LNC, etc.) are handled consistently
- The sanitization system is designed to handle future connection types without code changes

This approach follows the Open/Closed principle - the system is open for extension but closed for modification. When adding new connection methods, sensitive fields will be automatically redacted if they follow recognizable patterns, or new patterns can be added to the existing array of patterns.

#### MCP Specification Compliance

The system implements the MCP Specification version `2025-03-26`:

- Tool definitions follow the schema defined in the specification
- Server validates all tool inputs and outputs against the schema
- MCP Inspector 1.7.0 compatibility is maintained
- Schema validation occurs at startup to catch issues early

## Modularity

Each layer is independently testable. The domain layer has no external dependencies. Infrastructure depends on abstractions defined upstream. Dependencies are passed explicitly through constructors or factory methods.

## Testing Strategy

Unit tests are prioritized in the domain and application layers. Integration tests are used for infrastructure and interface-level functionality. Tests should reflect the architectural boundaries and enforce separation of concerns.

## Additional Notes

Business logic should not be placed in the application or infrastructure layers. Complexity should be centralized in the domain. Adapters should depend on stable interfaces, not concrete implementations.

For contribution and development practices, see [CONTRIBUTING.md](./CONTRIBUTING.md).
