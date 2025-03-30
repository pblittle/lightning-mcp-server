# Architecture

## Overview

This system is organized according to Clean Architecture and Domain-Driven Design (DDD) principles. The architecture enforces a clear separation of concerns, encourages testable business logic, and isolates infrastructure from domain logic.

## Design Principles

The architecture follows several key principles:

- Clean Architecture defines the project structure.
- Domain-Driven Design is used to model business rules.
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

## Modularity

Each layer is independently testable. The domain layer has no external dependencies. Infrastructure depends on abstractions defined upstream. Dependencies are passed explicitly through constructors or factory methods.

## Testing Strategy

Unit tests are prioritized in the domain and application layers. Integration tests are used for infrastructure and interface-level functionality. Tests should reflect the architectural boundaries and enforce separation of concerns.

## Additional Notes

Business logic should not be placed in the application or infrastructure layers. Complexity should be centralized in the domain. Adapters should depend on stable interfaces, not concrete implementations.

For contribution and development practices, see [CONTRIBUTING.md](./CONTRIBUTING.md).
