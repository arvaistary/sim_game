# План исправления тестов (Vitest + Nuxt4)

> Дата создания: 2026-04-15
> Проблема: Все тесты падают с `TypeError: Cannot read properties of undefined (reading 'config')`
> Среда: Vitest 4.1.4, Node v24.13.0, Nuxt 4.4.2

---

## 📋 Сводка проблемы

### Симптом
```
FAIL  test/minimal.test.ts
TypeError: Cannot read properties of undefined (reading 'config')
 ❯ test/minimal.test.ts:3:1
      1| import { describe, expect, test } from 'vitest'
      2|
      3| describe('minimal test', () => {
```

### Что УЖЕ сделано
- [x] Создан `vitest.config.ts` с алиасами `@/`, `~/`, `@domain/`
- [x] Исключены `.kilo/worktrees/` из тестов (было 27 → 17 файлов)
- [x] Выполнен `nuxt prepare` — `.nuxt/tsconfig.json` существует

### Что НЕ работает
- Даже `test/minimal.test.ts` (простой `expect(1+1).toBe(2)`) падает
- Ошибка внутри Vitest — при вызове `describe()` что-то внутри Vitest равно `undefined`
- Модуль `vitest` импортируется корректно (проверено через `node -e "import('vitest')"`)

---

## 🔍 Диагностика

### Гипотезы (по приоритету)

| # | Гипотеза | Вероятность | Проверка |
|---|----------|-------------|----------|
| 1 | Vitest 4.1.4 несовместим с Node v24.13.0 | 🔴 Высокая | Запустить на Node 22 LTS |
| 2 | `@vitest/browser` конфликтует с обычным vitest | 🟡 Средняя | Временно удалить `@vitest/browser` |
| 3 | Nuxt auto-imports ломают Vitest runtime | 🟡 Средняя | Создать `tsconfig.test.json` без Nuxt |
| 4 | Vitest 4.x требует `vitest.workspace.ts` | 🟢 Низкая | Создать workspace config |

---

## 🏗️ Этап 1: Диагностика корневой причины

### 1.1. Проверить совместимость Node + Vitest

```bash
# Проверить текущую версию
node -v  # v24.13.0

# Попробовать запустить на Node 22 (если доступен через nvm)
nvm use 22
npx vitest run test/minimal.test.ts
```

**Если тест проходит на Node 22** → проблема в совместимости Node 24 + Vitest 4.1.4.
Решение: либо обновить Vitest, либо использовать Node 22.

### 1.2. Проверить конфликт @vitest/browser

```bash
# Временно переименовать
rename node_modules\@vitest\browser _browser_off

# Запустить тест
npx vitest run test/minimal.test.ts

# Вернуть обратно
rename node_modules\@vitest\_browser_off browser
```

**Если тест проходит** → `@vitest/browser` конфликтует.
Решение: удалить `@vitest/browser` из devDependencies если не используется.

### 1.3. Проверить Nuxt auto-imports

Создать временный `tsconfig.test.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strictNullChecks": false,
    "types": ["vitest/globals"],
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

И в `vitest.config.ts` добавить:
```typescript
test: {
  typecheck: {
    tsconfig: './tsconfig.test.json'
  }
}
```

---

## 🏗️ Этап 2: Исправление конфигурации Vitest

### 2.1. Обновить vitest.config.ts

В зависимости от результатов диагностики:

**Вариант A: Если проблема в Node 24**
```typescript
// vitest.config.ts — добавить pool configuration
export default defineConfig({
  test: {
    pool: 'forks',  // или 'threads'
    poolOptions: {
      forks: {
        execArgv: ['--experimental-vm-modules'],
      },
    },
  },
})
```

**Вариант B: Если проблема в @vitest/browser**
- Удалить `@vitest/browser` из `package.json`
- Запустить `npm install`

**Вариант C: Если проблема в Nuxt auto-imports**
- Создать `tsconfig.test.json` без расширения `.nuxt/tsconfig.json`
- Обновить `vitest.config.ts` для использования отдельного tsconfig

### 2.2. Финальная конфигурация vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // Environment
    environment: 'node',

    // Test discovery
    include: ['test/**/*.test.ts'],
    exclude: [
      '**/.kilo/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
    ],

    // Globals (для import { describe, test, expect } from 'vitest')
    globals: true,

    // Timeout
    testTimeout: 30000,

    // Setup files (если нужны)
    // setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~': resolve(__dirname, 'src'),
      '@constants': resolve(__dirname, 'src/constants/index.ts'),
      '@utils': resolve(__dirname, 'src/utils/index.ts'),
      '@domain': resolve(__dirname, 'src/domain/index.ts'),
      '@composables': resolve(__dirname, 'src/composables/index.ts'),
    },
  },
})
```

---

## 🏗️ Этап 3: Исправление отдельных тестов

После того как `test/minimal.test.ts` начнёт проходить, нужно проверить и исправить остальные тесты.

### 3.1. Тесты, которые должны проходить без изменений

Эти тесты используют только domain-логику (без Nuxt/Vue):

| Файл | Зависимости | Ожидание |
|------|-------------|----------|
| `test/minimal.test.ts` | Нет | ✅ Должен проходить |
| `test/unit/domain/childhood/*.test.ts` (6 файлов) | GameWorld, ECS | ✅ Должны проходить |
| `test/unit/domain/balance/*.test.ts` (2 файла) | Domain константы | ✅ Должны проходить |
| `test/unit/domain/engine/*.test.ts` (2 файла) | GameWorld, game-facade | ⚠️ Может потребовать правок |

### 3.2. Тесты, которые могут потребовать правок

| Файл | Проблема | Решение |
|------|----------|---------|
| `test/unit/architecture/*.test.ts` (3 файла) | Читают файловую систему | Проверить пути |
| `test/integration/store/game-store.integration.test.ts` | Использует Pinia + Nuxt | Нужен `@nuxt/test-utils` или моки |
| `test/integration/childhood/childhood-flow.test.ts` | GameWorld + все системы | Проверить совместимость |
| `test/e2e/routes/routes-smoke.test.ts` | Nuxt routes | Нужен `@nuxt/test-utils` |

### 3.3. Возможные проблемы в тестах

1. **`createWorldFromSave()`** — может требовать полный INITIAL_SAVE
2. **`getTypedComponent()`** — может не работать без Nuxt контекста
3. **Pinia** — `createPinia()` / `setActivePinia()` может не работать без Vue
4. **Auto-imports** — `defineNuxtConfig`, `useRouter` и т.д. не доступны в тестах

---

## 🏗️ Этап 4: Создание test setup (если нужно)

### 4.1. Создать `test/setup.ts`

```typescript
import { vi } from 'vitest'

// Мок для Nuxt auto-imports если нужно
vi.mock('#app', () => ({
  defineNuxtConfig: vi.fn(),
  useNuxtApp: vi.fn(),
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}))

// Мок для Pinia если нужно
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(() => ({})),
  setActivePinia: vi.fn(),
}))
```

### 4.2. Обновить `vitest.config.ts`

```typescript
test: {
  setupFiles: ['./test/setup.ts'],
}
```

---

## 📅 Порядок выполнения

```
Шаг 1: Диагностика (Этап 1)                    ─── 30 мин
  ↓ (определяем корневую причину)
Шаг 2: Исправление конфигурации (Этап 2)        ─── 30 мин
  ↓ (minimal.test.ts проходит)
Шаг 3: Проверка всех тестов (Этап 3.1)          ─── 30 мин
  ↓ (исправляем падающие)
Шаг 4: Исправление отдельных тестов (Этап 3.2)  ─── 1-2 часа
  ↓ (все тесты проходят)
Шаг 5: Создание setup если нужно (Этап 4)       ─── 30 мин

ИТОГО: 3-4 часа
```

---

## ✅ Критерии успеха

1. `npx vitest run test/minimal.test.ts` — ✅ проходит
2. `npx vitest run test/unit/domain/childhood/` — ✅ все 6 тестов проходят
3. `npx vitest run test/unit/domain/balance/` — ✅ все 2 теста проходят
4. `npx vitest run test/unit/domain/engine/` — ✅ все 2 теста проходят
5. `npx vitest run` — ✅ максимальное количество тестов проходит
6. `npx tsc --noEmit` — 0 новых ошибок

---

## ⚠️ Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Vitest 4.x несовместим с Node 24 | Высокая | Критичное | Даунгрейд Node или Vitest |
| Nuxt auto-imports ломают тесты | Средняя | Среднее | Отдельный tsconfig для тестов |
| Pinia тесты требуют Nuxt контекст | Средняя | Низкое | Моки или `@nuxt/test-utils` |
| Некоторые тесты устарели | Низкая | Низкое | Обновить или удалить |
