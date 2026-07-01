---
name: rules-check-uncommitted
description: >-
  Двухфазная проверка незакоммиченных изменений: автоматика (rules:audit:changed,
  typecheck) + обязательный проход агента по каждому .cursor/rules/*.mdc.
  Используй перед коммитом, /rules-check-uncommitted, «проверь на правила».
---

# Rules Check — незакоммиченные изменения

Проверка **только uncommitted** (staged + unstaged + untracked). Результат засчитывается только после **обеих фаз**.

## Триггер

- Перед коммитом / PR
- `/rules-check-uncommitted`
- «Проверь незакоммиченное на правила»

---

## Фаза A — автоматика (обязательно)

Из корня репозитория:

```bash
git status --short
npm run rules:audit:changed
```

Если среди изменений есть `src/**/*.ts`, `src/**/*.vue` или `tsconfig.json`:

```bash
npx nuxt prepare
npm run typecheck
```

При исправимых нарушениях:

```bash
npm run rules:fix -- <path-from-git-status>
npm run rules:audit:changed
```

**Критерий прохождения фазы A:** exit code 0 у `rules:audit:changed`; у `typecheck` — 0 или осознанный skip (только docs/plans без кода).

---

## Фаза B — агент по `.cursor/rules` (обязательно)

Автоматика **не заменяет** чтение правил. Без фазы B проверка **не завершена**.

### B1. Список правил

Прочитай **все** файлы:

```
.cursor/rules/00-local-only.mdc
.cursor/rules/10-typing.mdc
.cursor/rules/15-nuxt-typescript.mdc
.cursor/rules/20-code-style.mdc
.cursor/rules/30-architecture.mdc
.cursor/rules/40-styles.mdc
```

Карта «что где автоматизировано»: [RULES-MAP.md](RULES-MAP.md).

### B2. Scope из git

Для **каждого** незакоммиченного auditable-файла (`src/**`, `tsconfig.json`, `*.scss` в `src/`):

```bash
git diff -- <path>
git diff --cached -- <path>
```

Для untracked без diff — прочитай файл целиком.

Определи слой (pages / components / stores / domain / …) и примени таблицу «Выбор затронутых правил» из RULES-MAP.

### B3. Чеклист по каждому `.mdc`

Заполни статус **pass / fail / n/a** с кратким обоснованием и путём к файлу при fail.

| Правило | Что проверить в diff (кратко) |
|---------|-------------------------------|
| **00-local-only** | Решения только из локальных rules/skills репозитория |
| **10-typing** | `*.types.ts`, явные аннотации, `import type`, нет `any`, нет inline object types |
| **15-nuxt-typescript** | tsconfig минимальный; явные импорты не-store символов; indexed access; enum import; store methods exist |
| **20-code-style** | script setup order; TSDoc на export; v-if/v-for; formatting; no `void` async |
| **30-architecture** | import direction; Ui* location; component layout; SSR/client guards |
| **40-styles** | scoped/global placement; @use not @import; utility vs custom SCSS |

Не дублируй findings фазы A — отметь «уже в audit» или подтверди, что исправлено.

### B4. Исправления

1. typecheck errors  
2. rules:audit / eslint  
3. нарушения только из фазы B  

Повтори **фазу A** и **B3** до чистого результата.

---

## Отчёт (обязательный формат)

```markdown
## Rules check (uncommitted)

**Git scope:** … (N paths)

### Phase A — automation
| Check | Result | Notes |
|-------|--------|-------|
| rules:audit:changed | pass/fail | N findings |
| nuxt prepare + typecheck | pass/fail/skipped | |

### Phase B — .cursor/rules
| Rule file | Result | Findings |
|-----------|--------|----------|
| 00-local-only.mdc | pass/fail/n/a | |
| 10-typing.mdc | pass/fail/n/a | |
| 15-nuxt-typescript.mdc | pass/fail/n/a | |
| 20-code-style.mdc | pass/fail/n/a | |
| 30-architecture.mdc | pass/fail/n/a | |
| 40-styles.mdc | pass/fail/n/a | |

### Verdict
- **Ready to commit:** yes / no
- **Must fix:** …
- **Optional:** …
```

**Ready to commit = yes** только если фаза A зелёная и в фазе B нет `fail`.

---

## Ограничения

- Скрипт не парсит `.mdc` — фаза B всегда на агенте.
- Docs/plans без `src/**` — typecheck skip; фаза B для кодовых `.mdc` — `n/a`, кроме 00.
- `rules:fix` только на пути из git status, не на весь `src/`.

## Команды

| Команда | Фаза |
|---------|------|
| `npm run rules:audit:changed` | A |
| `npm run rules:audit -- <path>` | A (точечно) |
| `npm run rules:fix -- <path>` | A (после fail) |
| `npx nuxt prepare` + `npm run typecheck` | A |
