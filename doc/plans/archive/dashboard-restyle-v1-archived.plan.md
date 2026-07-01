---
name: Dashboard restyle v1 (archived)
overview: "Первая версия плана рестайлинга. Минимальный скоуп: только визуал + dashboard shell. Заменён на v2 (Extended scope + Linear-эстетика) 2026-07-01. Сохранён для истории решений."
status: archived
---

> **Архивная версия.** Базовый скоуп (только визуал). Заменена планом `dashboard_restyle_v2`.
> Решения в этой версии: slate+emerald палитра, responsive shell (sidebar+bottomnav), без новых admin-функций.
> Пользователь расширил скоуп до **Extended** (командная палитра, settings drawer, density toggle, onboarding-tour и т.д.) и выбрал **Linear/Vercel** тренд.

# План v1: Dashboard restyle (минимальный скоуп)

## Цель и границы

Перевести визуал игры на эстетику современной админ-панели: виджеты/карточки, метрики, плотный dashboard-grid. **Функционал не трогать** — меняются только SCSS, layout-обёртки и template-разметка страниц. Stores, composables, domain, application — без изменений.

**Решения (v1):**
- Палитра: **Slate + emerald accent** (нейтрально-серый с зелёным акцентом, SaaS-стиль)
- Layout: **Sidebar desktop + bottom nav mobile** (responsive)
- Скоуп: **Minimal** — только визуал + topbar с темой/профилем

## Этапы v1

### 1. Design tokens — [src/assets/scss/variables.scss](src/assets/scss/variables.scss)

- Заменить primitive colors на slate-шкалу (`#0F172A, #1E293B, #334155, #475569, #64748B, #94A3B8, #CBD5E1, #E2E8F0, #F1F5F9, #F8FAFC`)
- `$color-brand-primary` → emerald `#10B981`, hover `#059669`, active `#047857`
- Accent emerald-soft `#ECFDF5` для бейджей
- `$card-padding: 20px`, `$card-radius: $radius-xl` (20px)
- Новые semantic: `$color-bg-app`, `$color-bg-surface-2`
- Новые tokens: `$sidebar-width`, `$bottomnav-height`, `$topbar-height`
- Тёмная тема: slate-900/800

### 2. Global styles — [src/assets/scss/global.scss](src/assets/scss/global.scss)

- Body background: тонкий slate gradient
- Скроллбары: 8px slate-300 thumb, slate-100 track
- Utility-классы: `.kpi-grid`, `.widget`, `.widget__header`, `.widget__title`, `.widget__body`, `.badge`, `.badge--success/warning/danger`
- `.dashboard-grid` под виджетную сетку (12-col на desktop)

### 3. Dashboard shell layout — новый [src/components/layout/DashboardLayout/DashboardLayout.vue](src/components/layout/DashboardLayout/DashboardLayout.vue) + `.scss`

```
<div class="dashboard-shell">
  <aside class="dashboard-shell__sidebar"><slot name="sidebar" /></aside>
  <div class="dashboard-shell__main">
    <header class="dashboard-shell__topbar"><slot name="topbar" /></header>
    <main class="dashboard-shell__content"><slot /></main>
  </div>
  <nav class="dashboard-shell__bottomnav"><slot name="bottomnav" /></nav>
</div>
```
- Desktop (≥1024px): sidebar fixed 240px, topbar 56px, bottomnav hidden
- Mobile (<1024px): sidebar hidden, topbar compact, bottomnav fixed 64px

### 4. GameNav → dual-mode — [src/components/global/GameNav/GameNav.vue](src/components/global/GameNav/GameNav.vue) + `.scss`

Логика сохраняется. CSS dual-mode:
- Sidebar mode: vertical list, emerald left-border active
- Bottom nav mode: horizontal scroll (8 items плохо помещаются)

### 5. GameLayout → обёртка над DashboardLayout — [src/components/layout/GameLayout/GameLayout.vue](src/components/layout/GameLayout/GameLayout.vue)

Вариант **B**: GameLayout остаётся, внутри делегирует в DashboardLayout. Страницы не трогаем.

### 6. RoundedPanel → dashboard card — [src/components/ui/RoundedPanel/index.vue](src/components/ui/RoundedPanel/index.vue) + `style.scss`

- Default radius 20px, padding 20px
- Slot `#header` (backwards-compatible)
- Проп `accent` для декоративной полосы слева

### 7. Главная dashboard — [src/pages/game/index.vue](src/pages/game/index.vue) + `index.scss`

- Top-row: 3 KPI-карточки равные колонки
- Ниже: 2-колоночная сетка (HomePreview + WorkButton CTA)
- Mobile: 1 колонка

### 8. KPI-виджеты

- **[ProfileCard.vue](src/components/pages/dashboard/ProfileCard/ProfileCard.vue)**: avatar+initial, name+job, KPI метрики
- **[StatsCard.vue](src/components/pages/dashboard/StatsCard/StatsCard.vue)**: 6 stat-bars в 2 колонки
- **[ActivityLogCard.vue](src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue)**: лента событий с footer-link

### 9. Остальные страницы (8 шт.) — стилевое выравнивание

home, actions, work, finance, education, skills, events, shop, activity, selfdev

- Убрать локальные `chip`/`card`/`meta-tag` styles из [work/index.vue](src/pages/game/work/index.vue) (lines 140-321)
- Обновить ActionCard, ActionTabs, BalancePanel, CareerTrack, ProgramList, SkillList, EventCard под slate/emerald

### 10. Start page — [src/pages/index.vue](src/pages/index.vue) + `index.scss`

Split-screen admin login: slate-950 gradient слева, форма справа.

### 11. Escape-меню — [src/app.vue](src/app.vue)

Минимальный рестайлинг scoped styles под slate/emerald.

### 12. Проверка

- `npm run lint`
- ReadLints на отредактированных файлах

## Риски v1

- Bottom nav с 8 пунктами плохо помещается — выбран scroll
- Modal/Toast/GameModalHost не рестайлятся (могут подтянуться через CSS vars)

## Почему заменён на v2

- Не учтены UI-примитивы (GameButton, Modal, Toast, ProgressBar, Tooltip) — массово используются
- Нет admin-функций: командной палитры, settings drawer, density toggle, onboarding
- Пользователь выбрал Extended scope + Linear-эстетику
- Не учтены accessibility (`prefers-reduced-motion`, focus-visible), mono-шрифт для метрик
