# ADR-0001: Миграция с Phaser на Nuxt 4

**Дата:** апрель 2026
**Статус:** Принято

## Контекст

Проект изначально был реализован на Phaser 3 — игровом движке для 2D-игр. Phaser хорошо подходит для игр с canvas-рендерингом, но имеет ограничения:
- Нет экосистемы UI-компонентов
- Сложная интеграция с браузерными API
- Меньше инструментов для state management
- Ограниченная поддержка TypeScript по сравнению с Vue/Nuxt

С ростом проекта стало ясно, что фокус смещается в сторону сложного UI, форм, state management и less — к canvas-рендерингу.

## Решение

Полностью мигрировать проект с Phaser 3 на Nuxt 4 + Vue 3 + Pinia + TypeScript:
- **UI Framework:** Vue 3 с Composition API
- **App Framework:** Nuxt 4 (SPA mode)
- **State Management:** Pinia
- **Language:** TypeScript (strict mode)
- **Styling:** SCSS

## Последствия

### Положительные

- Экосистема Vue/Nuxt: огромная библиотека компонентов, composables, utils
- Отличная поддержка TypeScript: type-safe компоненты, автозавершение
- Pinia: современный state management для Vue 3
- Nuxt: автозагрузка, файловый роутинг, middleware, plugins
- Большое сообщество и документация

### Отрицательные

- Потеря canvas-рендеринга (но проект смещается к веб-UI)
- Кривая обучения для разработчиков без опыта Vue/Nuxt
- Рефакторинг существующего кода

## Альтернативы

### Альтернатива 1: Остаться на Phaser
- **Минусы:** Нет UI-экосистемы, сложная интеграция
- **Почему нет:** Проект требует сложного UI, а не canvas

### Альтернатива 2: React + Next.js
- **Минусы:** Меньший опыт команды в React
- **Почему нет:** Команда имеет больше опыта в Vue

### Альтернатива 3: SvelteKit
- **Минусы:** Меньшая экосистема, меньше примеров
- **Почему нет:** Vue/Nuxt более зрелое решение

---

**Связанные документы:**
- [doc/adr/nuxt4-architecture-analysis.md](nuxt4-architecture-analysis.md)
- [Nuxt 4 architecture analysis](nuxt4-architecture-analysis.md)
