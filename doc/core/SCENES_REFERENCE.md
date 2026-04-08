# Справочник сцен (актуально)

**Последнее обновление:** 8 апреля 2026

## Точка входа

- **`index.html`** подключает **`src/bootstrap.js`** (Vite).
- Регистрация сцен и `Phaser.Game` задаются в `bootstrap.js`.
- В режиме разработки доступен `window.__GAME_LIFE_GAME` (см. `bootstrap.js`).

## Сцены в репозитории (`src/scenes/`)

| Файл | Ключ сцены | Назначение |
|------|------------|------------|
| `StartScene.js` | `StartScene` | Создание персонажа, форма старта |
| `SchoolIntroScene.js` | `SchoolIntroScene` | Мини-игра школы |
| `InstituteIntroScene.js` | `InstituteIntroScene` | Мини-игра института |
| `MainGameSceneECS.js` | `MainGameScene` | Главный HUD, нижняя навигация |
| `HomeScene.js` | `HomeScene` | Дом: мебель, комфорт, переезд (`home`) |
| `ShopScene.js` | `ShopScene` | Магазин: еда и покупки (`shop`) |
| `FunScene.js` | `FunScene` | Развлечения (`fun`) |
| `SocialScene.js` | `SocialScene` | Социальная жизнь (`social`) |
| `RecoveryScene.js` | `RecoveryScene` | Опционально: один экран с `init({ initialTab })`; общая логика в `recovery/RecoveryTabSceneCore.js` |
| `CareerScene.js` | `CareerScene` | Должности, доход в день, требования |
| `FinanceScene.js` | `FinanceScene` | Обзор, расходы, действия, инвестиции; прокручиваемый блок контента |
| `EducationScene.js` | `EducationScene` | Программы обучения и активные курсы; панель программ с маской и скроллом |
| `EventQueueScene.js` | `EventQueueScene` | Очередь событий и выборы |
| `SkillsScene.js` | `SkillsScene` | Экран навыков |

Сцены с суффиксом `ECS` в имени класса (например `EducationSceneECS`) по-прежнему регистрируются под коротким ключом из таблицы.

## Интеграция с ECS

Игровая логика сцен опирается на **`SceneAdapter`** (`src/ecs/adapters/SceneAdapter.js`) и системы из `src/ecs/systems/`. Сохранение — через **`PersistenceSystem`** и `PersistenceSystem.saveGame` / загрузка при старте сцен, где это нужно.

## UI: общие замечания

- Длинные списки (финансы, восстановление, программы обучения) используют **контейнер + маска + скролл** (колесо и при необходимости touch).
- Вложенные карточки внутри панелей позиционируются в **локальных координатах** относительно родительского контейнера строки карточки, без повторного смещения мировых `sceneX`/`panel.x` в локальные позиции дочерних элементов.
- Общие виджеты: `src/ui-kit.js` (панели, кнопки, модалки, toast).

## Устаревшие имена в старых документах

Вне репозитория или в старых черновиках могли фигурировать `main.js` / `main-ecs.js`, отдельные `HomeScene` / `ShopScene` и т.д. Ориентируйтесь на таблицу выше и содержимое `src/scenes/`.
