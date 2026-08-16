# Accent + Glass Design System — Rollout Plan

**Date:** 2026-08-15  
**Scope:** весь пользовательский интерфейс Game Life, светлая и тёмная темы, все accent palettes  
**Reference:** приложенный экран пролога «Лагерь»

## 1. Цель

Распространить визуальный принцип пролога на приложение:

1. Акцентный token окрашивает не только CTA, но и атмосферу страницы: фоновые glow/gradient, active-состояния, focus и тонкие декоративные детали.
2. Основной контент расположен на полупрозрачных матовых поверхностях, через которые читается фон, но текст сохраняет контраст.
3. Вложенные карточки образуют понятную иерархию поверхностей, а не набор одинаковых непрозрачных прямоугольников.
4. Один semantic contract работает для `emerald`, `cobalt`, `violet`, `sunset`, light и dark без локальной перекраски компонентов.

Это эволюция текущей Nexus UI, не отдельный skin пролога.

## 2. Что работает в референсе

- Тёмный нейтральный canvas удерживает фокус на контенте.
- Бирюзовый accent повторён в левом glow, активном шаге, tag dots, бордерах и верхнем маркере карточки.
- Правый фиолетовый glow использует secondary accent и добавляет глубину без конкуренции с primary action.
- Главная карточка полупрозрачна: фон виден, но blur и tint обеспечивают читаемость.
- Вложенные choices темнее/прозрачнее родительской поверхности и отделены тонкой обводкой.
- Акцент используется дозированно: заголовки и основной текст остаются нейтральными.
- Скругления образуют шкалу: pill → nested action → content panel.

## 3. Аудит текущего проекта

### Уже есть

- Primitive → semantic → component архитектура в `src/assets/scss/variables.scss` и `global.scss`.
- Light/dark semantic tokens для background, text, border и action.
- Четыре runtime palette: `emerald`, `cobalt`, `violet`, `sunset`.
- Глобальный двухцветный gradient на `body`.
- Общие `RoundedPanel`, `.widget`, `GameButton`, `Modal`, layout shell.
- `backdrop-filter` уже применяется в modal overlays, toast, command palette, settings drawer и topbar.

### Проблемы

1. **Accent gradient захардкожен.** `body` использует фиксированные teal/violet `rgb()`, поэтому смена palette не меняет атмосферу страницы.
2. **Surface tokens непрозрачны.** `--color-bg-card`, `surface` и `elevated` описывают цвет, но не материал/прозрачность.
3. **Glass не систематизирован.** Есть `blur-base`, но нет semantic glass tokens и уровней surface.
4. **Компоненты расходятся.** Большинство карточек используют `background: var(--color-bg-card)`; blur есть только в 6 местах.
5. **Локальные цвета обходят palette.** В 76 style-файлах найдено 149 hex- и 87 `rgb()`-вхождений. Часть оправдана primitive/status tokens, часть — локальный visual debt.
6. **Education — главный hotspot.** `EducationLevel.scss` содержит 37 локальных color-вхождений и собственные dark overrides.
7. **Dark overrides распределены.** Только 7 style-файлов содержат локальные theme overrides; материал должен определяться глобальными tokens, а не компонентами.
8. **Иерархия поверхностей слабая.** Sidebar, topbar, widget, nested card и modal часто отличаются только оттенком непрозрачного slate/white.
9. **Glass fallback не определён.** Нет явного поведения при отсутствии `backdrop-filter`, reduced transparency или слабом contrast.

## 4. Правила новой системы

### 4.1 Accent отвечает за

- primary CTA и selected state;
- focus ring;
- небольшой edge/stripe активной карточки;
- ambient glow на page canvas;
- hover border/glow;
- progress и активную навигацию;
- информационные элементы только там, где `status-info` семантически совпадает с accent.

Accent **не** окрашивает основной текст, все карточки целиком, danger/success/warning и большие площади без функциональной причины.

### 4.2 Surface hierarchy

| Уровень | Назначение | Материал |
|---------|------------|----------|
| Canvas | фон приложения | opaque base + primary/secondary ambient glow |
| Glass chrome | sidebar, topbar, bottom nav | высокий blur, низкая opacity, sticky-safe |
| Glass panel | page sections, widgets, modal/dialog | средний blur, theme tint, видимый border |
| Glass inset | choices, rows, filters, nested cards | меньший blur или без blur, контрастный translucent fill |
| Solid control | primary CTA, destructive action | opaque semantic action color |

Не применять blur к каждой строке: blur принадлежит крупной surface; вложенные элементы используют translucent fill. Это уменьшает GPU cost и сохраняет глубину.

### 4.3 Theme behavior

**Dark:** прозрачные светлые tints поверх slate canvas, более яркий accent, тонкая светлая граница, умеренный glow.

**Light:** прозрачные белые tints поверх слегка окрашенного canvas, более тёмный accent для AA, серо-цветная граница, короткая мягкая тень. Glass должен быть заметен через цветной фон, а не через чрезмерную прозрачность.

Контраст текста проверяется относительно итогового composited background, не значения token в изоляции.

## 5. Token contract

Добавить в `:root` и dark override:

```scss
// Ambient canvas
--color-ambient-primary: color-mix(in srgb, var(--color-action-primary) 18%, transparent);
--color-ambient-secondary: color-mix(in srgb, var(--color-action-secondary) 11%, transparent);
--color-canvas-base: var(--color-bg-page);

// Glass material
--color-glass-chrome: rgb(255 255 255 / 20%);
--color-glass-panel: rgb(255 255 255 / 58%);
--color-glass-inset: rgb(255 255 255 / 42%);
--color-glass-border: color-mix(in srgb, var(--color-action-primary) 16%, var(--color-border));
--color-glass-highlight: rgb(255 255 255 / 48%);

--blur-glass-chrome: 20px;
--blur-glass-panel: 16px;
--blur-glass-overlay: 8px;
--saturate-glass: 125%;

--shadow-glass-panel: 0 18px 50px rgb(15 23 42 / 10%);
--shadow-accent-soft: 0 0 28px color-mix(in srgb, var(--color-action-primary) 16%, transparent);
```

Dark values:

```scss
--color-glass-chrome: rgb(15 23 42 / 30%);
--color-glass-panel: rgb(30 41 59 / 68%);
--color-glass-inset: rgb(15 23 42 / 38%);
--color-glass-border: color-mix(in srgb, var(--color-action-primary) 24%, var(--color-border));
--color-glass-highlight: rgb(255 255 255 / 10%);
--shadow-glass-panel: 0 22px 60px rgb(0 0 0 / 24%);
```

Финальные opacity подбираются визуально и по contrast tests. Компоненты не должны содержать свои light/dark значения.

### Palette extension

Каждая palette продолжает задавать только primary/secondary/action tokens. Ambient tokens автоматически вычисляются через `color-mix()`. При необходимости palette может переопределить только intensity, не структуру gradient.

## 6. Общие primitives

### Mixins/utilities

Добавить в `mixins.scss`:

- `glass-surface($level: panel)` — background, border, blur, saturation, shadow;
- `glass-inset` — nested fill/border без дорогого blur;
- `accent-edge($placement)` — декоративная линия как в прологе;
- `ambient-canvas` — единый token-driven page background;
- `glass-fallback` через `@supports not (backdrop-filter: blur(1px))`.

Предпочтительный CSS API для Vue-компонентов:

- `.surface-glass-chrome`
- `.surface-glass-panel`
- `.surface-glass-inset`
- `.surface-accent-edge`

Не создавать отдельный Vue wrapper только ради стиля. Расширить `RoundedPanel` variants, а `.widget` перевести на тот же material contract.

## 7. Миграция компонентов

### Wave 1 — foundation

1. `variables.scss`, `global.scss`, palette files: новые tokens и token-driven body gradient.
2. `mixins.scss`: glass/ambient/fallback primitives.
3. `RoundedPanel`, `.widget`: единая glass panel surface.
4. Storybook отсутствует — добавить внутреннюю dev showcase страницу или component fixture с матрицей theme × palette × surface.

**Gate:** 4 palettes × 2 themes визуально различимы; text/border/focus проходят contrast.

### Wave 2 — application shell

- `DashboardLayout`: ambient canvas; glass sidebar/topbar/bottom nav.
- `Topbar`, `GameNav`: inset hover/active states из accent tokens.
- `Tabs`, `DropdownSelect`, filter chips: glass inset + opaque selected state.

**Gate:** навигация читается при scroll; sticky surfaces не мерцают; mobile bottom nav не сливается с контентом.

### Wave 3 — shared overlays and controls

- `Modal`, `GameModalHost`, `CommandPalette`, `SettingsDrawer`, `OnboardingTour`.
- `Toast`, `Tooltip`, dropdown menus.
- `GameButton`, inputs, progress, badges.

Overlay backdrop остаётся отдельным затемнением. Сам dialog получает glass panel; destructive confirmations сохраняют status semantics.

### Wave 4 — dashboard and common cards

- `ProfileCard`, `StatsCard`, `ActivityLogCard`, `HomePreview`.
- `DayPlannerPanel`, `DayPlannerSummary`, `WorkResultModal`.
- `ActionCard`, `EmptyState`, `SectionHeader`.

Стандарт: outer widget = glass panel; rows/metrics/actions = glass inset; accent edge только для active/featured state.

### Wave 5 — feature pages

Порядок по охвату и риску:

1. Actions / Work / Skills.
2. Finance / Events / Activity.
3. Education — отдельный cleanup локальных colors и status mapping.
4. Home / Shop / Self-development / Plan.
5. Start/login screens.
6. Prologue — перевести текущую удачную реализацию на общие tokens без визуальной регрессии.

Для каждой страницы удалить локальные surface/theme значения после перевода на primitives. Status colors и предметные визуализации не заменять accent без семантической причины.

## 8. Пролог как контрольный образец

Пролог становится reference implementation:

- заменить его локальные glass/background значения общими tokens;
- сохранить композицию, прозрачность, accent edge, pills и nested choices;
- добавить светлую версию с тем же уровнем глубины;
- сделать screenshot fixtures для dark/light и минимум `emerald` + `violet`;
- сравнивать остальные мигрированные поверхности с прологом по material hierarchy, а не копировать размеры/композицию.

## 9. Доступность и производительность

- WCAG AA: normal text 4.5:1, large 3:1, controls/focus 3:1.
- `prefers-reduced-transparency`: повысить opacity surface, отключить backdrop blur.
- `prefers-reduced-motion`: gradient статичен; никаких постоянно плавающих glow.
- `@supports` fallback: opaque semantic surface + обычная shadow/border.
- Не более 3 одновременно видимых крупных blurred layers в обычной странице.
- Не анимировать `filter`/`backdrop-filter`; только opacity/transform.
- Проверить scroll FPS на 1366×768 и среднем mobile viewport.

## 10. Проверка

### Automated

- Stylelint запрещает новые raw hex/rgb вне token/palette/status allow-list.
- Unit test theme settings сохраняет palette/theme contract.
- Component tests проверяют variants/classes, focus и disabled states.
- Contrast script рендерит вычисленные theme/palette пары для ключевых text/surface combinations.
- `npm run typecheck`, `npm run rules:audit`, unit tests.

### Visual regression matrix

Минимальные маршруты:

- `/game` dashboard;
- `/game/actions`;
- `/game/work`;
- `/game/education`;
- `/game/finance`;
- modal + drawer + command palette;
- `/game/prologue` fixture.

Матрица: light/dark × 4 palettes × desktop/mobile. Полный набор можно разделить: все palettes на foundation fixture, `emerald` и `violet` на всех маршрутах.

Проверять: canvas glow, hierarchy, text contrast, border visibility, selected/hover/focus, nested surfaces, disabled/status states, overflow и blur fallback.

## 11. Порядок поставки

1. Foundation PR: tokens, mixins, showcase, lint guard.
2. Shell PR: body/layout/nav/topbar.
3. Shared UI PR: panel/widget/overlay/control primitives.
4. Dashboard PR.
5. Feature PRs небольшими группами.
6. Education cleanup PR.
7. Prologue tokenization + visual regression baseline.
8. Final hardcoded-color audit and documentation.

Каждый PR должен быть визуально завершён в обеих темах; не оставлять страницу наполовину glass, наполовину opaque.

## 12. Definition of Done

- Canvas gradient следует выбранной palette в light и dark.
- Все основные content surfaces используют общий glass material contract.
- Пролог визуально не деградировал и больше не зависит от локальных material colors.
- Light/dark имеют одинаковую hierarchy, а не формальную инверсию цветов.
- Четыре palettes корректно влияют на glow, active, focus и accent edge.
- Status colors не подменены accent token.
- Нет новых raw colors вне утверждённого token/status слоя; существующий debt сокращён и задокументирован.
- Contrast, keyboard focus, reduced transparency/motion и fallback проверены.
- Основные desktop/mobile маршруты прошли visual regression.
- Blur не вызывает заметной деградации scroll/interaction performance.

## 13. Вне scope

- Изменение layout или информационной архитектуры всех страниц.
- Новые иллюстрации и анимационные сцены.
- Перекраска semantic success/warning/danger в accent.
- Полный отказ от solid surfaces: таблицы высокой плотности и performance-sensitive области могут использовать opaque semantic fallback.
