# Code Style

## Naming Conventions

### Variables and Functions
- Use meaningful, domain-specific names
- Boolean variables use prefixes: `is/has/can/should/was/are`
- Functions start with action verbs: `get`, `set`, `update`, `load`, `handle`, `create`, `remove`, `fetch`, `toggle`

```typescript
// ✅ GOOD
const isActive: boolean = true;
const canExecuteAction: boolean = checkPrerequisites();
const hasCompletedTutorial: boolean = true;

function getUserById(id: string): User {
  // ...
}

function handleButtonClick(): void {
  // ...
}

// ❌ BAD
const active: boolean = true;  // Missing prefix
const check: boolean = false;   // Not specific
const a: boolean = true;        // Not meaningful

function user(id: string): User {  // Missing action verb
  // ...
}
```

### Components
- `Ui*` prefix ONLY for components in `src/components/ui/`
- Layout components in `src/components/layout/`
- Game-specific components in `src/components/game/`
- Page-specific components in `src/components/pages/`

### Composables
- Format: `useXxx` (PascalCase after `use`)
- Directory name must match composable name: `useActivity/index.ts` (not `use-activity`)
- No duplicate composables with different naming styles

### Callbacks
- Use meaningful names in `.map()`, `.filter()`, `.forEach()`, `.find()`, `.reduce()`
- Prefer domain names over single letters

```typescript
// ✅ GOOD
const result = items.map((reportItem: ReportItem) => processItem(reportItem));
const active = users.filter((user: User) => user.isActive);

// ❌ BAD
const result = items.map((x: ReportItem) => processItem(x));
const active = users.filter((u: User) => u.isActive);
```

## Import Organization

### Import Groups
Group imports and separate groups with empty lines:

```typescript
// 1. Vue/Nuxt imports
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// 2. Third-party libraries
import { debounce } from 'lodash.debounce';
import { Swiper, SwiperSlide } from 'swiper/vue';

// 3. Project imports (use aliases)
import type { ActionResult } from '@/domain/balance/types';
import { getActionById } from '@/domain/balance/actions';
import { executeLifestyleAction } from '@/application/game/commands';
import { useGameStore } from '@/stores/game.store';

// 4. Component imports (if needed)
import GameButton from '@/components/ui/GameButton.vue';

// 5. Type imports (type-only)
import type { CareerTrack } from '@/domain/balance/types/career';
```

### Project Aliases
Use project aliases consistently:
- `@/` (root)
- `@/components/*`
- `@/stores/*`
- `@/composables/*`
- `@/domain/*`
- `@/application/*`
- `@/utils/*`
- `@/constants/*`

### Type Imports
Use `import type` for type-only imports:
```typescript
import type { User, ActionResult } from '@/domain/balance/types';
import type { CareerTrack } from '@/types/career';
```

Prefer inline `import type` in existing groups over separate import lines.

## Vue SFC Structure

### `<script setup>` Block Order

Follow this strict sequence:

```vue
<script setup lang="ts">
// 1. Imports (grouped and separated by empty lines)
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import type { UserProfile } from './UserProfile.types';
import { useGameStore } from '@/stores/game.store';
import { getUserProfile } from '@/application/game/queries';

// 2. Props definition
interface Props {
  userId: string;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
});

// 3. Emits definition
interface Emits {
  (e: 'update', userId: string): void;
  (e: 'delete', userId: string): void;
}

const emit = defineEmits<Emits>();

// 4. Routing
const router = useRouter();
const route = useRoute();

// 5. Pinia stores
const gameStore = useGameStore();
const userStore = useUserStore();

// 6. Components (if needed)
const LazyComponent = defineAsyncComponent(() =>
  import('@/components/ComplexComponent.vue'),
);

// 7. Derived constants/flags
const IS_DEBUG = import.meta.env.DEV;
const MAX_RETRIES = 3;

// 8. Local state
const userProfile = ref<UserProfile | null>(null);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

// 9. Computed properties
const displayName = computed<string>(() => {
  return userProfile.value?.name ?? 'Unknown';
});

const canEdit = computed<boolean>(() => {
  return props.showDetails && !isLoading.value;
});

// 10. Handlers/functions
function handleLoadProfile(): void {
  isLoading.value = true;
  // ... logic
}

function handleUpdate(): void {
  emit('update', props.userId);
}

// 11. Lifecycle hooks
onMounted(() => {
  handleLoadProfile();
});

watch(() => props.userId, (newUserId: string) => {
  handleLoadProfile();
});

// 12. Guard conditions
if (!props.userId) {
  throw new Error('userId is required');
}
</script>
```

### Block Separation Rules
- One empty line between consecutive logical blocks
- One empty line after `defineProps`, `defineEmits`, store declarations
- One empty line before `if` after variable declarations (unless `if` is first in function)
- No empty lines within the same logical block

### Guard Conditions
- Simple guard returns: single-line format
- Complex guard returns: multi-line format with explicit return

```typescript
// ✅ GOOD: Simple guard
if (!isValid) return null;
if (value === undefined) return defaultValue;

// ✅ GOOD: Complex guard
if (error) {
  console.error('Failed to load data', error);
  return null;
}

// ❌ BAD: Using void for fire-and-forget
void someAsyncCall();  // Hides errors

// ✅ GOOD: Explicit await or Promise handling
await someAsyncCall();
someAsyncCall().catch(handleError);
```

## Vue Best Practices

### Conditional Rendering
- Use `v-if` instead of `&&` for conditional rendering
- Use `v-for` with required `:key`
- Prefer `computed` over methods for derived values
- Use `v-model` for two-way binding instead of manual handlers

```vue
<template>
  <!-- ✅ GOOD: v-if -->
  <div v-if="isVisible">Content</div>

  <!-- ❌ BAD: && operator -->
  <div>{{ isVisible && 'Content' }}</div>

  <!-- ✅ GOOD: v-for with :key -->
  <div v-for="item in items" :key="item.id">{{ item.name }}</div>

  <!-- ✅ GOOD: computed property -->
  <div>{{ displayName }}</div>

  <!-- ❌ BAD: method in template -->
  <div>{{ getDisplayName() }}</div>

  <!-- ✅ GOOD: v-model -->
  <input v-model="username" />

  <!-- ❌ BAD: manual binding -->
  <input :value="username" @input="username = $event.target.value" />
</template>
```

### Component Syntax
- Short syntax for components without slots: `<ComponentName />`
- Full syntax for components with slots: `<ComponentName><slot /></ComponentName>`

```vue
<template>
  <!-- ✅ GOOD: No slots -->
  <GameButton @click="handleClick" />

  <!-- ✅ GOOD: With slots -->
  <Modal>
    <template #header>Header</template>
    <template #body>Body</template>
  </Modal>

  <!-- ❌ BAD: Inconsistent -->
  <GameButton></GameButton>
</template>
```

### Dynamic Components
Use `<component :is="..." />` for dynamic components:
```vue
<template>
  <component :is="currentComponent" />
</template>
```

## Styling Rules

### SCSS Separation
- Component styles MUST be in separate `.scss` files
- Structure: `ComponentName.vue` + `ComponentName.scss` (or `style.scss` for `ui/`)
- Import in `<script setup>`: `import './ComponentName.scss'`
- NO `<style>` blocks in `.vue` files (neither inline nor `src=`)
- Exception: Components without styles have no import and no `<style>` block

```vue
<!-- ✅ GOOD: Separate SCSS file -->
<script setup lang="ts">
import './UserProfile.scss';
// ... component logic
</script>

<template>
  <div class="user-profile">...</div>
</template>

<!-- ❌ BAD: Inline styles -->
<style scoped>
.user-profile {
  /* ... */
}
</style>
```

## Function Parameters

### 1-2 Parameters
Keep on same line:
```typescript
// ✅ GOOD
function getUser(id: string): User {
  // ...
}

function updateUser(id: string, name: string): User {
  // ...
}
```

### 3+ Parameters
Prefer single object with destructuring:
```typescript
// ✅ GOOD: Single object parameter
function createUser(data: CreateUserInput): User {
  const { name, email, age, role } = data;
  // ...
}

// ❌ BAD: Too many parameters
function createUser(name: string, email: string, age: number, role: string, department: string): User {
  // ...
}
```

## Array Method Chaining

### Single Call
Keep method on same line:
```typescript
// ✅ GOOD
const result = items.map((item: Item) => processItem(item));

// ✅ GOOD: Multi-line callback
const result = items.map((item: Item) => {
  const processed = processItem(item);
  return transformItem(processed);
});
```

### Multiple Calls
Format as "ladder" on new lines:
```typescript
// ✅ GOOD: Ladder format
const result = items
  .map((item: Item) => processItem(item))
  .filter((item: Item) => item.isValid)
  .reduce((acc: Item[], item: Item) => [...acc, item], []);

// ✅ GOOD: Multi-line callbacks
const result = items
  .map((item: Item) => {
    const processed = processItem(item);
    return transformItem(processed);
  })
  .filter((item: Item) => {
    return item.isValid && item.isActive;
  });
```

## Pinia Store Usage

### Store Actions
Single-line format for simple actions:
```typescript
// ✅ GOOD
store.executeLifestyleAction(actionId);
store.updateUserPreferences(preferences);

// ❌ BAD: Unnecessary multi-line
store.executeLifestyleAction(
  actionId
);
```

### State Mutations
Use actions instead of direct mutations (Setup API handles this automatically).

## Async Functions

### Single Await in Tail
Use explicit `return` without extra `async`:
```typescript
// ✅ GOOD
function login(): Promise<void> {
  return loginWithKeycloak();
}

// ❌ BAD: Unnecessary async
async function login(): Promise<void> {
  return await loginWithKeycloak();
}
```

## Vue Lifecycle Hooks

### Arrow Functions Preferred
Use arrow functions for lifecycle hooks:
```typescript
// ✅ GOOD
onMounted(() => {
  initializeComponent();
});

// ❌ BAD: Named function
onMounted(function mounted(): void {
  initializeComponent();
});
```

### Watch Handlers
Use separate handler functions for readability:
```typescript
// ✅ GOOD
watch(userId, (newUserId: string, oldUserId: string) => {
  handleUserChange(newUserId, oldUserId);
});

// ❌ BAD: Inline handler
watch(userId, (newUserId: string, oldUserId: string) => {
  loadUserProfile(newUserId);
  updatePermissions(newUserId);
  notifyUserChanged(oldUserId, newUserId);
});
```

## TSDoc for Public Exports

All exported functions must have TSDoc comments:
```typescript
/**
 * @description Domain - Execute a lifestyle action and return the result
 * @param {string} actionId - The ID of the action to execute
 * @return {ActionResult} The result of executing the action
 */
export function executeLifestyleAction(actionId: string): ActionResult {
  // ...
}
```

## Nuxt Data Composables

### useAsyncData / useFetch
- Always provide stable key if data is cached between transitions
- Explicitly type return values with named types
- Use explicit error handling in UI

```typescript
// ✅ GOOD: Stable key + explicit typing
const { data, pending, error } = await useAsyncData<UserProfile>(
  `user-${userId}`,
  () => getUserProfile(userId),
);

<template>
  <div v-if="error">Error loading profile</div>
  <div v-if="pending">Loading...</div>
  <div v-if="data">{{ data.name }}</div>
</template>
```

## Code Style Checklist

## Rules Audit Baseline

`npm run rules:audit` keeps pre-existing repository debt in `scripts/rules-audit-baseline.json` and fails when new rule/file pairs appear. Remove baseline entries when legacy debt is deliberately remediated; do not update baseline to hide new violations.

- [ ] Names are meaningful and domain-specific
- [ ] Boolean variables use prefixes (is/has/can/should/was/are)
- [ ] Functions start with action verbs
- [ ] Components follow prefix conventions (Ui* for ui/)
- [ ] Imports are grouped and separated by empty lines
- [ ] Project aliases are used consistently
- [ ] Type-only imports use `import type`
- [ ] Vue SFC follows strict block order
- [ ] Guard conditions use appropriate format
- [ ] Callbacks use meaningful names
- [ ] Styles are in separate `.scss` files
- [ ] No `<style>` blocks in `.vue` files
- [ ] `v-if` used instead of `&&`
- [ ] `v-for` has required `:key`
- [ ] `computed` preferred over methods for derived values
- [ ] Public exports have TSDoc comments
- [ ] Array methods formatted correctly (single vs ladder)

## Related Documentation

- **Type Rules:** `constitution.md` (incorporates `.cursor/rules/10-typing.mdc`)
- **Nuxt/TS Rules:** `constitution.md` (incorporates `.cursor/rules/15-nuxt-typescript.mdc`)
- **Architecture Rules:** `architecture/overview.md` (incorporates `.cursor/rules/30-architecture.mdc`)

**Source of Truth:** All rules derived from `.cursor/rules/20-code-style.mdc`
