# План полного удаления ECS (GameWorld, game-facade, 32 системы)

> **Статус:** TODO  
> **Версия:** 1.0  
> **Дата:** 20 апреля 2026  

---

## Цель

Полностью удалить legacy ECS архитектуру:
- ❌ GameWorld (класс)
- ❌ 32 ECS системы (TimeSystem, StatsSystem, ActionSystem, etc.)
- ❌ game-facade (создание мира, команды, запросы)
- ❌ system-context (контекст систем)
- ✅ Оставить только Pinia stores

---

## Зачем удалять

| Проблема | Описание |
|----------|----------|
| Дублирование логики | Stores + ECS делают одно и то же |
| Сложность поддержки | Два подхода вместо одного |
| Размер бандла | 32 класса = лишний код |
| Технический долг | Непонятно где искать баги |

---

## Анализ зависимостей

### 1. Кто использует game-facade

```
src/application/game/commands.ts  → game-facade/commands.ts
src/application/game/queries.ts   → game-facade/queries.ts
src/domain/index.ts               → export * from game-facade
```

### 2. Кто использует ECS системы (через game-facade)

```
game-facade/commands.ts → TimeSystem, ActionSystem, CareerProgressSystem...
game-facade/queries.ts  → TimeSystem, StatsSystem, SkillsSystem...
game-facade/system-context.ts → все системы
```

### 3. Кто использует GameWorld напрямую

```
src/domain/game-facade/index.ts → new GameWorld()
```

---

## Пошаговый план

### Фаза 1: Анализ и подготовка (1 день)

- [ ] Карта всех публичных API game-facade
- [ ] Карта всех публичных API GameWorld
- [ ] Определить что нужно для persistence (save/load)
- [ ] Определить что нужно для commands/queries

### Фаза 2: Переписать application/game (2 дня)

- [ ] Создать новые команды в Pinia stores
- [ ] Переписать `src/application/game/commands.ts` → использовать stores напрямую
- [ ] Переписать `src/application/game/queries.ts` → использовать stores напрямую
- [ ] Обновить все места где используются эти команды

### Фаза 3: Переписать persistence (2 дня)

- [ ] Определить формат сохранения (JSON)
- [ ] Реализовать save() в каждом store
- [ ] Реализовать load() в каждом store
- [ ] Обновить `LocalStorageSaveRepository`
- [ ] Удалить PersistenceSystem

### Фаза 4: Удалить game-facade (1 день)

- [ ] Удалить `src/domain/game-facade/commands.ts`
- [ ] Удалить `src/domain/game-facade/queries.ts`
- [ ] Удалить `src/domain/game-facade/system-context.ts`
- [ ] Удалить `src/domain/game-facade/index.ts`
- [ ] Удалить `src/domain/index.ts` (или обновить)

### Фаза 5: Удалить ECS системы (2 дня)

- [ ] Удалить все 32 системы из `src/domain/engine/systems/`
- [ ] Удалить `src/domain/engine/world.ts` (GameWorld)
- [ ] Удалить `src/domain/engine/components/`
- [ ] Удалить `src/domain/engine/types/` (если не нужны)

### Фаза 6: Тестирование и фиксы (2 дня)

- [ ] Запустить TypeScript проверку
- [ ] Запустить все тесты
- [ ] Проверить build
- [ ] Ручное тестирование (save/load, все actions)

---

## Ожидаемый результат

### До

```
src/
├── domain/
│   ├── engine/
│   │   ├── systems/       (32 класса)
│   │   ├── world.ts       (GameWorld)
│   │   └── components/
│   └── game-facade/       (commands, queries, system-context)
├── stores/                (11 Pinia stores)
└── application/game/      (транслирует в game-facade)
```

### После

```
src/
├── stores/                (11 Pinia stores + logic)
├── application/game/      (использует stores напрямую)
└── composables/           (используют stores)
```

---

## Критерии готовности

| Критерий | Метод проверки |
|----------|----------------|
| Нет ссылок на game-facade | `grep -r "game-facade"` |
| Нет ссылок на GameWorld | `grep -r "GameWorld"` |
| Нет ссылок на системы | `grep -r "TimeSystem\|StatsSystem"` |
| TypeScript 0 ошибок | `npx tsc --noEmit` |
| Все тесты проходят | `npm test` |
| Build успешен | `npm run build` |

---

## Оценка времени

| Фаза | Время |
|------|-------|
| Фаза 1: Анализ | 1 день |
| Фаза 2: Application layer | 2 дня |
| Фаза 3: Persistence | 2 дня |
| Фаза 4: game-facade | 1 день |
| Фаза 5: ECS системы | 2 дня |
| Фаза 6: Тестирование | 2 дня |
| **Итого** | **~10 дней** |

---

## Риски

1. **Сложность persistence** - нужно сохранять состояние всех stores
2. **Обратная совместимость** - могут быть внешние зависимости
3. **Тесты** - часть тестов использует ECS напрямую

### Митигация

- Писать новые тесты параллельно
- Сохранять API совместимость где возможно
- Делать итеративно с проверками после каждой фазы

---

## Начало работ

```bash
# Проверить текущее состояние
grep -r "game-facade" src/ --include="*.ts" | wc -l
grep -r "GameWorld" src/ --include="*.ts" | wc -l
grep -r "TimeSystem\|StatsSystem" src/ --include="*.ts" | wc -l
```