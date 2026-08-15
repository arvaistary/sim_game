# ADR-0007: Persisted prologue microbeat transitions

**Дата:** 2026-08-15
**Статус:** Принято

## Контекст

Pace profiles уже задавали необязательные microbeats, но runner завершал ход
сразу после выбора сцены. Из-за этого `match-pairs` оставался отдельным UI-демо,
а refresh между сценой и мини-игрой нельзя было безопасно возобновить.

## Решение

- Хранить `pendingMicrobeat` в `PrologueState`, который сохраняется вместе с
  runner snapshot.
- Создавать microbeat только в domain runner после школьной или post-secondary
  сцены; шанс и разрешение мини-игр читать из `ProloguePaceProfile`.
- Завершать его через общий `MinigameResult` и доменную функцию
  `completePrologueMicrobeat`.
- Применять награду через существующий `applyPrologueChoice`, поэтому stage
  budget и anti-imba caps остаются единственным механизмом выдачи силы.
- UI только показывает `MatchPairs` или безопасный одно-кликовый fallback и
  вызывает store action.

## Последствия

- Refresh/resume не теряет незавершённое действие.
- Новые minigames подключаются к тому же result-контракту без копирования
  переходов runner.
- `PrologueState` получил новое поле; загрузка старых snapshots остаётся
  совместимой, потому что отсутствие поля трактуется как `null`-состояние.

## Альтернативы

- Держать microbeat только в компоненте: отклонено, так как состояние теряется
  при refresh и обходится domain flow.
- Добавить отдельный статус для каждого minigame: отклонено, потому что это
  размножает state machine и не нужно для общего pending/result-контракта.
