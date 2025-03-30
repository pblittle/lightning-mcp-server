# LND MCP Server Architecture

This document provides a comprehensive architectural overview of the Lightning Network MCP Server. It details the design principles, patterns, and implementations that enable natural language queries to a Lightning Network node.

## 1. Architectural Overview

The Lightning Network MCP Server follows clean architecture principles with a domain-driven design approach. This creates clear separation of concerns, making the codebase maintainable, testable, and adaptable to different Lightning Network implementations.

### Architectural Layers

1. **Domain Layer**: Contains the core business logic, entities, value objects, and gateway interfaces
2. **Infrastructure Layer**: Implements the gateway interfaces for specific technologies (LND, CLN, Eclair)
3. **Application Layer**: Orchestrates the flow between interfaces and domain logic
4. **Interface Layer**: Handles external communication via the MCP protocol

## 2. Domain Layer

The domain layer is the heart of the application, containing:

### Entities and Value Objects

The domain model represents Lightning Network concepts through:

- **Entities**: Core domain objects with identity and lifecycle
  - `Channel`: Represents a Lightning Network payment channel
- **Value Objects**: Immutable objects representing domain concepts without identity
  - `Balance`: Represents channel balances (local/remote)
  - `Capacity`: Represents channel capacity
  - `HealthCriteria`: Defines thresholds for channel health

Value objects ensure type safety and encapsulate validation and business rules:

```typescript
// Example of a Value Object
export class Balance {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Balance {
    if (value < 0) {
      throw new Error('Balance cannot be negative');
    }
    return new Balance(value);
  }

  getValue(): number {
    return this.value;
  }

  ratioOf(capacity: Capacity): number {
    return this.value / capacity.getValue();
  }
}
```

### Domain Handlers

Domain handlers process domain-specific operations:

- `ChannelDomainHandler`: Manages channel-related queries
- `DomainHandler`: Interface for all domain handlers
- `DomainHandlerRegistry`: Maintains and routes to appropriate handlers

The handler pattern centralizes domain logic and separates it from infrastructure concerns.

### Gateway Pattern

The gateway pattern provides a clean abstraction for accessing external systems:

```typescript
// Gateway interface in domain layer
export interface LightningNetworkGateway {
  getChannels(): Promise<ChannelData[]>;
  getNodeInfo(pubkey: string): Promise<NodeInfo | undefined>;
  getNodeAlias(pubkey: string): Promise<string | undefined>;
  getConnection(): LightningNodeConnection;
}
```

This interface is implemented by concrete implementations in the infrastructure layer, allowing the domain layer to remain independent of specific Lightning Network implementations.

### Intent Parsing with Strategy Pattern

The system uses the Strategy pattern for intent parsing:

- `IntentParserStrategy`: Interface for different parsing strategies
- `RegexIntentParser`: Implementation using regular expressions
- `IntentParserFactory`: Creates the appropriate strategy based on configuration

This approach allows for:

- Easy swapping of parsing implementations
- Future enhancement with more sophisticated NLP strategies
- Separation of parsing logic from domain handling

## 3. Infrastructure Layer

The infrastructure layer implements domain interfaces for specific technologies:

### Adapter Pattern

The adapter pattern is used for Lightning node connections:

- `LightningNodeAdapter`: Abstract base adapter implementing `LightningNodeConnection`
- `LndAdapter`: Concrete adapter for LND nodes with multiple connection methods
- Future: `ClnAdapter`, `EclairAdapter`: For other Lightning implementations

This pattern allows each adapter to:

- Support multiple connection methods (GRPC, LNC, REST)
- Handle specific implementation details while presenting a consistent interface
- Manage authentication and connection lifecycle

### Gateway Implementations

- `LndGateway`: Implementation for LND nodes
- Future: `ClnGateway`, `EclairGateway`: For other Lightning implementations

Each gateway:

- Implements the `LightningNetworkGateway` interface
- Translates between domain models and specific node API data
- Works with any connection that supports its implementation

### Connection Management with SOLID Principles

The connection management follows SOLID principles:

- **Single Responsibility**: Each adapter handles only one node implementation
- **Open/Closed**: System is open for extension (new implementations) but closed for modification
- **Liskov Substitution**: All adapters can be used interchangeably as `LightningNodeConnection`
- **Interface Segregation**: Clean interfaces with focused methods
- **Dependency Inversion**: High-level modules depend on abstractions, not concrete implementations

Key components:

- `NodeImplementation`: Enum defining supported node implementations (LND, CLN, Eclair)
- `ConnectionMethod`: Enum defining connection methods (GRPC, LNC)
- `ConnectionDetails`: Type-safe connection parameters for different methods
- `ConnectionFactory`: Creates connections based on node implementation and connection details

## 4. Application Layer

The application layer orchestrates the flow between interfaces and domain:

- `LightningQueryProcessor`: Processes queries by:
  1. Parsing natural language to intents
  2. Routing to appropriate domain handlers
  3. Formatting responses for external consumption

## 5. Interface Layer

The interface layer handles communication with external systems:

- `McpServer`: Implements the MCP protocol for communication with LLMs
- `LightningMcpController`: Exposes Lightning Network functionality via MCP

## 6. Data Flow

```mermaid
sequenceDiagram
    participant User as User/LLM
    participant MCP as MCP Server
    participant Processor as Query Processor
    participant Parser as Intent Parser
    participant Handler as Domain Handler
    participant Gateway as Lightning Gateway
    participant Adapter as Node Adapter
    participant Node as Lightning Node

    User->>MCP: Natural language query
    MCP->>Processor: Process query
    Processor->>Parser: Parse intent
    Parser-->>Processor: Enhanced intent
    Processor->>Handler: Handle intent
    Handler->>Gateway: Request data
    Gateway->>Adapter: Call node methods
    Adapter->>Node: Query node (GRPC/LNC)
    Node-->>Adapter: Raw node data
    Adapter-->>Gateway: Normalized data
    Gateway-->>Handler: Domain objects
    Handler-->>Processor: Domain result
    Processor-->>MCP: Formatted response
    MCP-->>User: Human-readable and JSON response
```

## 7. Key Design Patterns

### Gateway Pattern

The Gateway pattern provides a clean abstraction for external resources, allowing the domain layer to remain free of implementation details.

### Adapter Pattern

The Adapter pattern provides a consistent interface to different Lightning implementations and connection methods, following SOLID principles.

### Strategy Pattern

The Strategy pattern enables swappable implementations for intent parsing, making it easy to enhance or replace parsing logic.

### Factory Pattern

Factories create appropriate implementations based on configuration:

- `ConnectionFactory`: Creates the right adapter based on node implementation
- `LightningNetworkGatewayFactory`: Creates the corresponding gateway
- `IntentParserFactory`: Creates the appropriate parser

### Value Object Pattern

Value objects encapsulate domain concepts, ensuring validation and providing business methods. They're immutable and don't have identity.

## 8. Type Safety and Validation

The system leverages TypeScript and Zod for robust type safety:

- **Static Types**: TypeScript provides compile-time checking
- **Runtime Validation**: Zod schemas validate input/output data
- **Schema/Type Alignment**: Types are derived from schemas to ensure consistency

```typescript
// Schema definition with Zod
export const ChannelParamsSchema = z.object({
  capacity: z.number().positive(),
  localBalance: z.number().nonnegative(),
  remoteBalance: z.number().nonnegative(),
  active: z.boolean(),
  remotePubkey: z.string(),
  channelPoint: z.string(),
  remoteAlias: z.string().optional(),
});

// Type derived from schema
export type ChannelParams = z.infer<typeof ChannelParamsSchema>;
```

## 9. Project Structure

The project structure mirrors the architectural layers:

```
src/
├── domain/                # Domain layer
│   ├── channels/          # Channel domain
│   │   ├── entities/      # Channel entities
│   │   ├── schemas/       # Schema definitions
│   │   └── value-objects/ # Domain value objects
│   ├── handlers/          # Domain operation handlers
│   ├── intents/           # Intent parsing
│   │   ├── entities/      # Intent models
│   │   ├── factories/     # Parser factories
│   │   └── strategies/    # Parsing strategies
│   ├── lightning/         # Lightning domain
│   │   └── gateways/      # Gateway interfaces
│   └── node/              # Node domain
├── infrastructure/        # Infrastructure layer
│   ├── adapters/          # Connection adapters
│   ├── factories/         # Infrastructure factories
│   └── lnd/               # LND implementation
├── application/           # Application layer
│   └── processors/        # Query processors
├── interfaces/            # Interface layer
│   └── mcp/               # MCP protocol implementation
└── core/                  # Cross-cutting concerns
    ├── config/            # Configuration management
    ├── errors/            # Error handling
    ├── logging/           # Logging utilities
    └── validation/        # Validation utilities
```

## 10. Future Extensibility

The architecture supports several extension points:

1. **New Lightning Implementations**: Add new adapters and gateways for CLN, Eclair, etc.
2. **Enhanced NLP**: Replace the RegexIntentParser with more sophisticated NLP
3. **Additional Domain Data**: Expand beyond channels to payments, invoices, etc.
4. **Advanced Health Metrics**: Enhance health criteria and analysis capabilities

## Conclusion

The Lightning Network MCP Server architecture demonstrates how clean architecture, SOLID principles, and domain-driven design create a system that is:

- **Modular**: Components can be developed and tested independently
- **Extensible**: New implementations can be added without disrupting existing code
- **Maintainable**: Clear separation of concerns simplifies understanding and changes
- **Adaptable**: Multiple Lightning Network implementations and connection methods are supported

This architecture ensures the system can grow and adapt to changing requirements while maintaining a strong foundation of domain concepts and clean separation of concerns.
