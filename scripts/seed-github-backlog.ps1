# Seeds GitHub Issues backlog from doc/core/ROADMAP.md (run once).
# Usage: pwsh -NoProfile -File scripts/seed-github-backlog.ps1

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $repoRoot '.env'
$match = Select-String -Path $envFile -Pattern '^GH_TOKEN_CLASSIC=(.*)$' | Select-Object -First 1

if ($null -eq $match) {
    Write-Error 'GH_TOKEN_CLASSIC not found in .env'
}

$env:GH_TOKEN = $match.Matches.Groups[1].Value.Trim()
$repo = 'arvaistary/sim_game'
$projectNumber = 2
$owner = '@me'

$items = @(
    @{
        Title = '[P0] Смерть и концовки — завершить цикл жизни'
        Labels = 'P0,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §1.1, `doc/core/IMPLEMENTATION_STATUS.md` модуль 6 (~45%)

## Scope
- Полный набор причин смерти и правил завершения жизни
- Финальный экран со статистикой (доработка)
- Типы концовок и оценка жизни
- Экспорт результата (изображение/QR — follow-up)
- New Game+ баланс: убрать сильное преимущество, рассмотреть стартовое происхождение

## Критерии готовности
- Завершение жизни покрыто тестами и manual QA
- New Game+ transfer согласован с GDD
'@
    },
    @{
        Title = '[P0] Социальные отношения'
        Labels = 'P0,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §1.2

## Scope
- Отношения по шкале 0–100
- Социальные действия и последствия
- Романтические отношения, поиск партнёра, друзья

## Зависимости
Блокирует «Семья и дети»
'@
    },
    @{
        Title = '[P0] Семья и дети'
        Labels = 'P0,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §1.3, IMPLEMENTATION_STATUS модуль 8 (~5%)

## Scope
- Брак и развод
- Рождение детей, возраст и состояние
- Воспитание и влияние на жизнь персонажа

## Зависимости
После базовой системы отношений
'@
    },
    @{
        Title = '[P0] Хобби и побочный заработок'
        Labels = 'P0,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §1.4, IMPLEMENTATION_STATUS модуль 9 (~35%)

## Scope
- Побочный заработок
- Мини-игры хобби
- Связь с временем, деньгами, навыками и событиями
'@
    },
    @{
        Title = '[P0] Достижения и трофеи'
        Labels = 'P0,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §1.5, IMPLEMENTATION_STATUS модуль 10 (~5%)

## Scope
- Условия и фиксация достижений (runtime producers)
- Экран достижений
- Бонусы, уведомления, локальный leaderboard
'@
    },
    @{
        Title = '[P0] Сезонные и праздничные события'
        Labels = 'P0,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §1.6, IMPLEMENTATION_STATUS модуль 11 (0%)

## Scope
- Календарь сезонов
- Праздничные события
- Влияние сезона на действия, расходы, шкалы и события

## Зависимости
Модель событий (P1 §2.1)
'@
    },
    @{
        Title = '[P0] Транспорт и расширенная модель здоровья'
        Labels = 'P0,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §1.7

## Scope
- Минимальный набор транспорта (время/деньги)
- Состояния здоровья beyond Game Over при health=0
- Связь с действиями, работой и событиями
'@
    },
    @{
        Title = '[P1] События — контент и модификаторы'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.1, IMPLEMENTATION_STATUS модуль 7 (~70%)

## Scope
- 25 событий GDD (дополнить контент)
- Рабочие и возрастные события, childhood follow-up
- Micro chance modifiers: risk/skill/state
- События по профессиям
'@
    },
    @{
        Title = '[P1] Финансы — инвестиции, цели, долги'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.2

## Scope
- Несколько инвестиционных продуктов
- Цели накопления
- Давление долгов и кредитов
- Экстренные финансовые события
'@
    },
    @{
        Title = '[P1] Жильё — уровни, аренда, соседи'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.3

## Scope
- Расширение уровней с визуальными улучшениями
- Долгосрочная аренда
- Изменение уровня жилья
- Влияние соседей на комфорт
'@
    },
    @{
        Title = '[P1] Работа, магазин и инвентарь'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.4

## Scope
- Покупки → `playerState.possessions`
- Компьютер как требование для интернет-поиска работы
- Магазин: категории learning/things/home, checkout
- Карьера + инвентарь + рабочие события
'@
    },
    @{
        Title = '[P1] Календарь периода — итерация 1'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.5 (первая итерация)

## Scope
- Каталог на `/game/plan`, добавление в любой день
- Мягкие предупреждения по прогнозу шкал
- Остановка прогона при невыполнимом шаге
- `copyDay`, редактирование остатка
- Очередь событий между днями
'@
    },
    @{
        Title = '[P1] Календарь периода — итерация 2'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.5 (вторая итерация)

## Scope
- Освоение 7/21/40 дней
- Монотонность действий
- Локации и синергия маршрута
- История и сводка периода
- Мобильная подача (свайп, bottom sheet)
'@
    },
    @{
        Title = '[P1] Глубина навыков'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.6

## Scope
- `learningMethod` в каталоге действий
- Устранить конфликт потолков 10/1000
- Нелинейная XP-модель в действиях
- Деградация, синергии, capstones
- Балансировка после телеметрии
'@
    },
    @{
        Title = '[P1] Обратная связь жизненного цикла'
        Labels = 'P1,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §2.7, IMPLEMENTATION_STATUS модуль 1/2

## Scope
- Визуальное старение и этапы жизни
- Цели и мотивация
- Недельный и месячный отчёты
'@
    },
    @{
        Title = '[P2] Частные игровые сценарии и QA'
        Labels = 'P2,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §3.1, IMPLEMENTATION_STATUS модуль 17

## Scope
- Unlock recruitment agency через gameplay
- E2E: поиск работы → пустой результат → лимит → увольнение
- Checkout/инвентарь/корзина edge cases
- Пролог: microbeat/minigame
- Manual: 5 compact runs, university flow, refresh/resume, adult-start
'@
    },
    @{
        Title = '[P2] Архитектурный долг — projections и bridge'
        Labels = 'P2,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §3.2, IMPLEMENTATION_STATUS GameWorld фаза 5

## Scope
- Stores → true projections над GameWorld
- Удалить deprecated `bridge.ts` / `legacy.ts` после server-mode
- E2E основных user flows
- Nitro/server-mode integration tests
- Storybook или dev showcase
'@
    },
    @{
        Title = '[P2] Design system и SettingsPage'
        Labels = 'P2,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §3.3

## Scope
- Завершить Accent + Glass Foundation
- Сократить raw colors, visual regression в темах
- Звук/музыка
- `SettingsPage.vue`
'@
    },
    @{
        Title = '[P3] Server persistence rollout (Vercel)'
        Labels = 'P3,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §4.1, IMPLEMENTATION_STATUS M3

## Scope
- Deploy merged main через main-only Vercel workflow
- Smoke: persistence, `/health`, `/ready`, retry, conflict
- Rollback/recovery rehearsal
- Зафиксировать в deployment-документации
'@
    },
    @{
        Title = '[P3] Эксплуатация — CI/CD и мониторинг'
        Labels = 'P3,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §4.2

## Scope
- CI/CD pipeline
- Production build optimization
- Performance monitoring
- Error tracking (Sentry)
- Analytics
'@
    },
    @{
        Title = '[P3] Платформы — Яндекс.Игры, VK Play, PWA'
        Labels = 'P3,enhancement'
        Body = @'
## Источник
`doc/core/ROADMAP.md` §4.3

## Scope
- Яндекс.Игры
- VK Play
- PWA / offline-capable SPA build
'@
    }
)

$created = @()

foreach ($item in $items) {
    $url = gh issue create --repo $repo --title $item.Title --body $item.Body --label $item.Labels
    gh project item-add $projectNumber --owner $owner --url $url | Out-Null
    $created += $url
    Write-Output $url
}

Write-Output "---"
Write-Output "Created $($created.Count) issues and added to project #$projectNumber"
