# Phaser Architecture Archive

Эта папка содержит устаревшие документы о Phaser.js архитектуре.

Проект полностью мигрировал на Nuxt 4 + Vue 3 + TypeScript.

## История миграции

### Почему произошла миграция?

Проект был изначально реализован на Phaser.js 3 с JavaScript. Для улучшения:
- Производительности
- Developer Experience (DX)
- SEO (для будущего)
- Тестируемости
- Модульности архитектуры

### Что изменилось?

| Аспект | Phaser.js | Nuxt 4 + Vue 3 |
|--------|-----------|----------------|
| **UI Framework** | Phaser (Canvas) | Vue 3 (DOM) |
| **Сцены** | Phaser Scene (.js) | Vue Pages (.vue) |
| **State Management** | Phaser Registry | Pinia |
| **Language** | JavaScript | TypeScript |
| **Routing** | Scene Manager | Vue Router (Nuxt) |
| **Building** | Vite | Nuxt 4 (Vite) |
| **Architecture** | ECS + SceneAdapter | ECS + Pinia + 4 layers |

### Преимущества новой архитектуры

1. **Better DX:** Vue 3 Composition API, TypeScript, hot reload
2. **Performance:** Virtual DOM, optimized reactivity
3. **Testability:** Unit testing Vue components is easier
4. **SEO Ready:** SSR support (though SPA mode is used)
5. **Modularity:** Clear separation of concerns (4 layers)
6. **Maintainability:** Type safety, better code organization

### Даты миграции

- **ECS Migration:** Завершена в апреле 2026
- **Vue 3 Migration:** Завершена в апреле 2026
- **Nuxt 4 Migration:** Завершена в апреле 2026

## Содержимое архива

### Устаревшие документы

- **SCENES_REFERENCE.md** - Справочник Phaser сцен
- **START_SCENE_DOCUMENTATION.md** - Документация сцен старта игры с мини-играми

### Актуальная документация

Смотрите актуальную документацию в `doc/`:

- **[../README.md](../README.md)** - Главная навигация
- **[core/README.md](../core/README.md)** - Обзор проекта
- **[core/ARCHITECTURE_OVERVIEW.md](../core/ARCHITECTURE_OVERVIEW.md)** - Обзор 4 архитектурных слоёв
- **[core/PAGES_REFERENCE.md](../core/PAGES_REFERENCE.md)** - Справочник Vue страниц
- **[core/START_GAME_DOCUMENTATION.md](../core/START_GAME_DOCUMENTATION.md)** - Документация старта игры
- **[NUXT4_ARCHITECTURE.md](../NUXT4_ARCHITECTURE.md)** - Nuxt 4 конфигурация
- **[COMPOSABLES_REFERENCE.md](../COMPOSABLES_REFERENCE.md)** - Справочник composables

---

**Примечание:** Этот архив сохранён для исторического контекста. Не используйте эти документы для разработки.
