# Bridge: `.cursor/rules` -> Spec-kit

Документ фиксирует, как локальные правила проекта должны быть встроены в контекст Spec-kit, чтобы агент применял их на всех этапах (`start/plan/tasks/implement/finalize`).

## Source of truth

- Единственный источник правил разработки: `.cursor/rules/*.mdc`.
- При конфликте с generic шаблонами Spec-kit приоритет у `.cursor/rules/*.mdc`.

## Что переносим в `.specify/memory/`

После `specify init` и `/speckit.adopt` синхронизируйте правила в:

- `.specify/memory/development/code-style.md`
- `.specify/memory/constitution.md`

### Минимальный набор правил для синхронизации

1. Из `.cursor/rules/30-architecture.mdc`
   - слоистая архитектура и допустимые импорты между слоями;
   - ограничения Nuxt server/client boundaries.
2. Из `.cursor/rules/20-code-style.mdc`
   - соглашения по структуре Vue SFC;
   - правила именования и форматирования;
   - вынос стилей в отдельные `.scss`.
3. Из `.cursor/rules/15-nuxt-typescript.mdc`
   - ограничения по `tsconfig` и Nuxt type-resolution;
   - правила явных импортов типов для Nuxt/TypeScript.
4. Из `.cursor/rules/10-typing.mdc`
   - типы в `*.types.ts`;
   - запрет inline object-типов;
   - `import type` и запрет `any`.

## Рекомендуемый baseline для `constitution.md`

Добавьте в `.specify/memory/constitution.md` обязательный принцип:

> Любые изменения кода и документации обязаны соответствовать правилам из `.cursor/rules/*.mdc`.  
> Если шаблоны или generic-инструкции Spec-kit противоречат локальным правилам проекта, применяются локальные правила проекта.

## Операционный цикл синхронизации

1. После `/speckit.adopt` заполнить/обновить `.specify/memory/development/code-style.md` на основе `.cursor/rules/*.mdc`.
2. Перед `/speckit.implement` проверить, что план/таски не нарушают архитектурные ограничения.
3. На `/speckit.finalize` повторно сверить актуальность `.specify/memory/*` с текущими `.cursor/rules/*.mdc`.
4. Если правила в `.cursor/rules/` обновились — обновить `.specify/memory/*` до следующего work-item.

## Prompt-шаблон для `adopt`/`finalize`

```text
Use `.cursor/rules/*.mdc` as the mandatory source of truth for project conventions.
Synchronize key constraints into `.specify/memory/development/code-style.md` and `.specify/memory/constitution.md`.
In case of conflicts with generic Spec-kit templates, prioritize `.cursor/rules/*.mdc`.
```
