# Architecture Overview

## High-Level Architecture

Game Life follows a **layered architecture** with strict unidirectional dependency flow:

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                      │
│  (pages → components → composables → stores)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Application Layer                           │
│                    (commands + queries)                       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Domain Layer                              │
│           (business logic + game balance)                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Infrastructure Layer                        │
│              (persistence + external systems)                 │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Utilities Layer                            │
│                  (utils + constants)                          │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Presentation Layer
**Location:** `src/pages/`, `src/components/`, `src/composables/`, `src/stores/`

**Responsibilities:**
- User interface and interaction
- State management (Pinia stores)
- Reusable UI logic (composables)
- Routing and navigation
- User input handling

**Key Patterns:**
- Vue SFC components with clear structure
- Composables for reusable logic
- Pinia stores for centralized state
- Auto-imported by Nuxt

### Application Layer
**Location:** `src/application/`

**Responsibilities:**
- Use case coordination
- Command execution (state mutations)
- Query execution (data retrieval)
- Orchestration between domain and infrastructure

**Key Files:**
- `commands.ts` - Commands that modify state
- `queries.ts` - Queries that read data
- `ports/` - Interfaces for infrastructure

**Examples:**
- `executeLifestyleAction` - Execute a recovery action
- `simulateWorkShift` - Simulate work and calculate results
- `getCareerTrack` - Get career progression data
- `canStartEducationProgram` - Check education prerequisites

### Domain Layer
**Location:** `src/domain/balance/`

**Responsibilities:**
- Business logic and rules
- Game balance data
- Action definitions (~222 actions)
- Game constants and configuration

**Key Directories:**
- `actions/` - Game action definitions
- `constants/` - Static game data
- `types/` - Domain types
- `utils/` - Domain-specific utilities

**Constraints:**
- NO UI code
- NO infrastructure dependencies
- ONLY imports from utils/constants

### Infrastructure Layer
**Location:** `src/infrastructure/`

**Responsibilities:**
- Persistence implementation
- External system integration
- File I/O operations

**Key Components:**
- `LocalStorageSaveRepository` - LocalStorage implementation
- `PostgresGameStateRepository` - PostgreSQL JSONB snapshot persistence with TTL and compare-and-swap
- `PostgresUnitOfWork` - Atomic state and processed-command transaction boundary
- Migration scripts - Append-only Drizzle schema migrations and readiness checks

### Utilities Layer
**Location:** `src/utils/`, `src/constants/`

**Responsibilities:**
- Pure utility functions
- Application constants
- Navigation configuration
- Formatters and helpers

**Constraints:**
- NO dependencies on other layers
- Pure functions only

## Import Rules

**Allowed Imports:**

| Layer          | Can Import From                          |
|----------------|------------------------------------------|
| Pages          | components, composables, stores, middleware |
| Components     | composables, stores, utils, constants, other components |
| Composables    | stores, application, domain, utils, constants |
| Stores         | application, domain, infrastructure, utils, constants |
| Application    | domain, utils, constants                |
| Domain         | utils, constants ONLY                    |
| Infrastructure | domain, utils, constants                |
| Utils          | NOTHING from other layers               |
| Constants      | NOTHING from other layers               |

## Key Architectural Patterns

### 1. Command Pattern
Commands encapsulate state-changing operations:
```typescript
// src/application/game/commands.ts
export function executeLifestyleAction(actionId: string): ActionResult {
  // Validate, apply domain logic, mutate state
}
```

### 2. Query Pattern
Queries encapsulate data retrieval:
```typescript
// src/application/game/queries.ts
export function getCareerTrack(careerId: string): CareerTrack {
  // Retrieve and return data
}
```

### 3. Repository Pattern
Infrastructure implements ports for persistence:
```typescript
// src/application/game/ports/SaveRepository.ts
export interface SaveRepository {
  save(data: GameState): Promise<void>;
  load(): Promise<GameState | null>;
}

// src/infrastructure/persistence/LocalStorageSaveRepository.ts
export class LocalStorageSaveRepository implements SaveRepository {
  // LocalStorage implementation
}
```

### 4. Composable Pattern
Vue composables encapsulate reusable logic:
```typescript
// src/composables/useFinance/index.ts
export function useFinance() {
  const store = useFinanceStore();
  // Return reactive API
}
```

## Technology Integration

### Nuxt 4 Integration
- **Routing:** File-based routing in `src/pages/`
- **Auto-import:** Components, composables, stores auto-imported
- **SSR:** Disabled (`ssr: false`) for client UI rendering
- **Nitro API:** `server/api/game/` exposes session-backed game commands and queries
- **Execution modes:** `spa`, `server`, and `hybrid`; configured through `runtimeConfig.public.gameMode`
- **Modules:** Pinia, ESLint, Color Mode
- **Aliases:** Configured for domain, utils, constants, composables

### Pinia Integration
- **State Management:** Centralized stores in `src/stores/`
- **Auto-import:** All stores auto-imported
- **Type Safety:** Fully typed with TypeScript

### TypeScript Integration
- **Strict Mode:** Enabled in tsconfig
- **No Any:** Strict prohibition of `any` type
- **Explicit Types:** All variables and functions explicitly typed

## Data Flow

### Action Execution Flow
```
User Click → Page → Component → Composable → Store → Application Command → Domain Action → Store Mutation → UI Update
```

### Data Retrieval Flow
```
Component → Composable → Store → Application Query → Domain Data → Store State → Computed Property → Display
```

## Benefits of This Architecture

1. **Separation of Concerns:** Each layer has a single responsibility
2. **Testability:** Each layer can be tested independently
3. **Maintainability:** Changes are isolated to specific layers
4. **Scalability:** Easy to add new features within the architecture
5. **Type Safety:** Strong typing throughout the codebase
6. **Reusability:** Composables and components are reusable

## Anti-Patterns to Avoid

1. **Business Logic in UI:** Never put game rules in components
2. **UI in Domain:** Never import Vue components in domain layer
3. **Skipping Layers:** Don't bypass the application layer
4. **Circular Dependencies:** Never import upward in the layer chain
5. **Inline Types:** Always use separate type files
6. **Any Types:** Never use `any` - use explicit types or `unknown`

## Related Documentation

- **Tech Stack:** `tech-stack.md`
- **Data Flow:** `data-flow.md`
- **Code Style:** `code-style.md`
- **ADRs:** `adr/README.md`
- **Full Architecture:** `doc/core/ARCHITECTURE_OVERVIEW.md`
