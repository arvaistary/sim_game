# Тестирование Game Life

Проект использует Vitest для unit/integration-тестов и отдельные integrity
проверки для маршрутов, режимов исполнения и API.

## Основные команды

```bash
npm test
npm run test:architecture
npm run test:standalone-server
npm run typecheck
npm run rules:audit
```

## Структура

- `test/unit/` — domain, application, stores и архитектурные границы;
- `test/integration/` — server API, режимы исполнения и lifecycle checks;
- `test/e2e/` — браузерные маршруты и viewport matrix;
- `scripts/integrity-audit/` — проверка audit artifacts.

Устаревшие ECS test examples удалены вместе с прежней архитектурой.
