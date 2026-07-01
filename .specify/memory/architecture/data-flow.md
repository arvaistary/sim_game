# Data Flow

## Overview

Data flows strictly downward through the architectural layers, following the dependency direction:

```
User Interaction → Pages → Components → Composables → Stores → Application → Domain → Infrastructure → Utils/Constants
```

## User Action Flow (State Mutation)

When a user performs an action (clicks a button, submits a form):

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Click
       ▼
┌─────────────┐
│   Page      │  (src/pages/game/*.vue)
└──────┬──────┘
       │ Call component handler
       ▼
┌─────────────┐
│  Component  │  (src/components/*/*.vue)
└──────┬──────┘
       │ Call composable function
       ▼
┌─────────────┐
│  Composable │  (src/composables/use*/index.ts)
└──────┬──────┘
       │ Call store action
       ▼
┌─────────────┐
│  Store      │  (src/stores/*.ts)
└──────┬──────┘
       │ Call application command
       ▼
┌─────────────┐
│ Application │  (src/application/game/commands.ts)
└──────┬──────┘
       │ Call domain logic
       ▼
┌─────────────┐
│   Domain    │  (src/domain/balance/actions/*.ts)
└──────┬──────┘
       │ Return action result
       ▼
┌─────────────┐
│  Store      │  (mutate state)
└──────┬──────┘
       │ State change triggers reactivity
       ▼
┌─────────────┐
│  Composable │  (computed re-evaluates)
└──────┬──────┘
       │ Component re-renders
       ▼
┌─────────────┐
│  Component  │  (UI updates)
└─────────────┘
```

### Example: Execute Lifestyle Action

```typescript
// User clicks "Watch Movie" button in Home page
// src/pages/game/home/index.vue
<button @click="handleWatchMovie">Watch Movie</button>

const handleWatchMovie = (): void => {
  const actionId = 'fun-watch-movie';
  executeAction(actionId);
};

// src/composables/useActions/index.ts
export function useActions() {
  const store = useActionsStore();

  function executeAction(actionId: string): void {
    store.executeLifestyleAction(actionId);
  }

  return { executeAction };
}

// src/stores/actions-store/index.ts
export const useActionsStore = defineStore('actions', () => {
  function executeLifestyleAction(actionId: string): void {
    // Call application command
    const result = executeLifestyleActionCommand(actionId);

    // Update store state
    currentActionResult.value = result;
  }

  return { executeLifestyleAction };
});

// src/application/game/commands.ts
export function executeLifestyleActionCommand(actionId: string): ActionResult {
  // Get action from domain
  const action = getActionById(actionId);

  // Execute action logic
  const result = applyAction(action);

  // Persist if needed
  if (result.hasStateChange) {
    saveRepository.save(gameState);
  }

  return result;
}

// src/domain/balance/actions/fun-actions.ts
export function applyAction(action: LifestyleAction): ActionResult {
  // Pure business logic
  const statChanges: StatChange[] = [
    { stat: 'energy', change: -action.energyCost },
    { stat: 'fun', change: action.funGain },
  ];

  return { statChanges, isValid: true };
}
```

## Data Request Flow (State Query)

When UI needs to display data:

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │ Call composable getter
       ▼
┌─────────────┐
│  Composable │
└──────┬──────┘
       │ Access store state
       ▼
┌─────────────┐
│  Store      │  (read state)
└──────┬──────┘
       │ Call application query
       ▼
┌─────────────┐
│ Application │  (src/application/game/queries.ts)
└──────┬──────┘
       │ Read domain data
       ▼
┌─────────────┐
│   Domain    │  (src/domain/balance/constants/*.ts)
└──────┬──────┘
       │ Return data
       ▼
┌─────────────┐
│  Store      │  (store in state)
└──────┬──────┘
       │ Expose as computed
       ▼
┌─────────────┐
│  Composable │  (return computed)
└──────┬──────┘
       │ Component uses in template
       ▼
┌─────────────┐
│  Component  │  (display data)
└─────────────┘
```

### Example: Get Career Track

```typescript
// src/composables/useCareer/index.ts
export function useCareer() {
  const store = useCareerStore();

  const currentCareer = computed(() => {
    return store.currentCareer;
  });

  return { currentCareer };
}

// src/stores/career-store/index.ts
export const useCareerStore = defineStore('career', () => {
  const careerId = ref<string>('software-developer');

  const currentCareer = computed(() => {
    return getCareerTrackQuery(careerId.value);
  });

  return { currentCareer };
});

// src/application/game/queries.ts
export function getCareerTrackQuery(careerId: string): CareerTrack {
  const careerDef = getCareerById(careerId);

  return {
    id: careerDef.id,
    title: careerDef.title,
    salary: careerDef.salary,
    levels: careerDef.levels,
  };
}

// src/domain/balance/constants/career-jobs.ts
export function getCareerById(id: string): CareerDefinition {
  return CAREER_JOBS[id];
}
```

## State Mutation Patterns

### Direct Store Mutation (Preferred for Simple Cases)

```typescript
// src/stores/game.store.ts
export const useGameStore = defineStore('game', () => {
  const energy = ref<number>(100);

  function decreaseEnergy(amount: number): void {
    energy.value = Math.max(0, energy.value - amount);
  }

  return { energy, decreaseEnergy };
});
```

### Command Pattern (Preferred for Complex Logic)

```typescript
// src/application/game/commands.ts
export function executeLifestyleActionCommand(actionId: string): ActionResult {
  const action = getActionById(actionId);

  // Validation
  if (!canExecuteAction(action)) {
    return { success: false, reason: 'Insufficient energy' };
  }

  // Apply action
  const result = applyAction(action);

  // Update state through stores
  const store = useGameStore();
  store.applyActionResult(result);

  return result;
}
```

## Persistence Flow

Game state is persisted after significant changes:

```
┌─────────────┐
│   Domain    │  (action applied)
└──────┬──────┘
       │ State changed
       ▼
┌─────────────┐
│ Application │  (command executed)
└──────┬──────┘
       │ Needs save
       ▼
┌─────────────┐
│  Store      │  (auto-save triggered)
└──────┬──────┘
       │ Call save
       ▼
┌─────────────┐
│Infrastructure│ (LocalStorageSaveRepository)
└──────┬──────┘
       │ Persist
       ▼
┌─────────────┐
│LocalStorage │
└─────────────┘
```

```typescript
// src/infrastructure/persistence/LocalStorageSaveRepository.ts
export class LocalStorageSaveRepository implements SaveRepository {
  async save(data: GameState): Promise<void> {
    const serialized = JSON.stringify(data);
    localStorage.setItem(SAVE_KEY, serialized);
  }

  async load(): Promise<GameState | null> {
    const serialized = localStorage.getItem(SAVE_KEY);
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized);
  }
}
```

## Reactivity Flow

Vue's reactivity system propagates changes through the dependency graph:

```
┌─────────────┐
│  Store      │  (ref changed)
└──────┬──────┘
       │ Notify dependents
       ▼
┌─────────────┐
│  Computed   │  (re-evaluate)
└──────┬──────┘
       │ Notify dependents
       ▼
┌─────────────┐
│  Component  │  (re-render)
└──────┬──────┘
       │ Update DOM
       ▼
┌─────────────┐
│     UI      │  (user sees change)
└─────────────┘
```

## Key Principles

### 1. Unidirectional Flow
- Data flows down through layers
- Actions flow up through layers
- No circular dependencies between layers

### 2. Single Source of Truth
- Store holds canonical state
- Domain holds business logic
- UI derives from store state

### 3. Reactive Updates
- Use `computed` for derived values
- Use `ref`/`reactive` for state
- Vue handles propagation automatically

### 4. Type Safety
- All data flow is typed
- No `any` types
- Explicit types at boundaries

### 5. Predictable State
- State changes only through actions
- No direct mutations from UI
- Clear trace of changes

## Anti-Patterns to Avoid

### 1. Business Logic in Components
```typescript
// ❌ WRONG: Business logic in component
const handleWork = (): void => {
  const result = salary * experienceMultiplier;
  wallet.value += result;
};

// ✅ CORRECT: Call store action
const handleWork = (): void => {
  store.executeWorkShift();
};
```

### 2. Direct Domain Access from UI
```typescript
// ❌ WRONG: UI imports domain
import { getCareerById } from '@/domain/balance/constants/career-jobs';

// ✅ CORRECT: Use store or composable
const career = store.career;
```

### 3. Skipping Layers
```typescript
// ❌ WRONG: Component calls domain directly
import { applyAction } from '@/domain/balance/actions';

// ✅ CORRECT: Component → Composable → Store → Application → Domain
store.executeAction(actionId);
```

## Data Flow Checklist

- [ ] Does data flow follow the layer direction?
- [ ] Are mutations only through actions/commands?
- [ ] Is state managed in stores?
- [ ] Are types explicit at all boundaries?
- [ ] Is reactivity used correctly (computed, ref)?
- [ ] Is persistence handled correctly?
- [ ] Are there no circular dependencies?
- [ ] Is business logic only in domain layer?
- [ ] Are imports following the architecture rules?
- [ ] Are types in separate files (not inline)?

## Related Documentation

- **Architecture Overview:** `architecture/overview.md`
- **Tech Stack:** `architecture/tech-stack.md`
- **Code Style:** `development/code-style.md`
- **Constitution:** `constitution.md`