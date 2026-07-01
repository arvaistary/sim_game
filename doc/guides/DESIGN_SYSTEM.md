# Дизайн-система «Nexus UI»

Визуальный язык и набор токенов для **game_life** (life-sim / игровой дашборд): карточки, метрики, навигация, формы. Референсы дашбордов из `artifact/` (Eduhouse, Alutem, MagicHeal, Intelly, Clarity, Lordbank, Health+, YourEducation и др.) задают **стиль**; паттерны вроде Kanban, Billing, HR из разделов 7–8 — **каталог на будущее**, если появятся соответствующие экраны, а не обязательный объём текущего продукта.

**Источник правды в коде (сейчас):** семантические и примитивные значения в [src/assets/scss/variables.scss](src/assets/scss/variables.scss) и глобальные стили в `src/assets/scss/` (см. [nuxt.config.ts](nuxt.config.ts), блок `css`). Таблицы ниже — спецификация; при расхождении с `variables.scss` сначала правьте SCSS, затем обновляйте этот документ (или наоборот при осознанном изменении дизайна).

---

## 1. Философия и принципы

| Принцип | Описание |
|---------|----------|
| **Unity** | Единый визуальный язык для игрового UI и, при необходимости, внутренних/админ-экранов на том же стеке. |
| **Clarity** | Контент на первом месте. Минимум декораций, максимум смысла. |
| **Hierarchy** | Чёткая визуальная иерархия: крупные заголовки → карточки метрик → второстепенный контент. |
| **Spacing** | Строгая **8pt grid system** — все отступы, padding, margin = 8 × n. |
| **Softness** | Скруглённые углы (20-24px), мягкие тени, пастельные тона — интерфейс «дышит». |
| **Consistency** | Единые токены цветов, единые паттерны компонентов. |
| **Accessibility** | Контраст ≥ 4.5:1, большие кликабельные области, поддержка dark mode. |

---

## 2. Цветовая палитра

### 2.1 Трёхслойная архитектура токенов

Токены структурированы по распространённой схеме **design tokens** (три слоя):

| Слой | Описание | Пример |
|------|----------|--------|
| **Primitive** | Базовые сырые значения, никогда не используются напрямую | `color-brand-primary-500` |
| **Semantic** | Смысловые алиасы — то, что реально применяется в компонентах | `color-action-primary` |
| **Component** | Специфические значения для компонентов, ссылаются на semantic | `button-primary-bg` |

### 2.2 Primitive Colors (Базовые)

#### Brand / Accent
| Токен | Значение | Источник |
|-------|----------|----------|
| `color-brand-primary-500` | `#00B2FF` (бирюзово-голубой) | Health+, Alutem, MagicHeal |
| `color-brand-accent-500` | `#FF6B6B` (кораллово-оранжевый) | Eduhouse, Lordbank |
| `color-brand-secondary-500` | `#7B61FF` (фиолетовый) | Clarity, YourEducation |

#### Neutral
| Токен | Значение | Использование |
|-------|----------|---------------|
| `color-neutral-0` | `#FFFFFF` | Белый |
| `color-neutral-50` | `#F8F7F4` | Бежевый фон (Eduhouse) |
| `color-neutral-100` | `#F1F0EB` | Subtle фон |
| `color-neutral-200` | `#E2E8F0` | Бордеры |
| `color-neutral-300` | `#CBD5E1` | Disabled |
| `color-neutral-400` | `#94A3B8` | Tertiary text |
| `color-neutral-500` | `#64748B` | Secondary text |
| `color-neutral-600` | `#475569` | — |
| `color-neutral-700` | `#334155` | — |
| `color-neutral-800` | `#1F2A44` | Primary text |
| `color-neutral-900` | `#0F172A` | Darkest |

#### Semantic Colors
| Токен | Значение |
|-------|----------|
| `color-success-500` | `#22C55E` |
| `color-warning-500` | `#F59E0B` |
| `color-danger-500` | `#EF4444` |
| `color-info-500` | `#3B82F6` |

### 2.3 Semantic Tokens (используются в компонентах)

#### Background
| Токен | Light | Dark | Использование |
|-------|-------|------|---------------|
| `color-bg-page` | `#F8F7F4` | `#0F172A` | Фон страницы |
| `color-bg-surface` | `#FFFFFF` | `#1E2937` | Поверхности |
| `color-bg-card` | `#FFFFFF + shadow` | `#1E2937` | Карточки |
| `color-bg-sidebar` | `#FFFFFF` + border | `#0F172A` + border | Сайдбар |
| `color-bg-header` | `#FFFFFF` | `#1E2937` | Хедер |

#### Text
| Токен | Light | Dark | Использование |
|-------|-------|------|---------------|
| `color-text-primary` | `#1F2A44` | `#F1F5F9` | Основной текст |
| `color-text-secondary` | `#64748B` | `#94A3B8` | Вторичный текст |
| `color-text-tertiary` | `#94A3B8` | `#64748B` | Третичный текст |
| `color-text-on-primary` | `#FFFFFF` | `#FFFFFF` | Текст на primary |
| `color-text-on-accent` | `#FFFFFF` | `#FFFFFF` | Текст на accent |

#### Border / Divider
| Токен | Light | Dark |
|-------|-------|------|
| `color-border` | `#E2E8F0` | `#334155` |
| `color-border-subtle` | `#F1F0EB` | `#1E2937` |

#### Interactive
| Токен | Значение | Dark |
|-------|----------|------|
| `color-action-primary` | `#00B2FF` | `#33C4FF` |
| `color-action-primary-hover` | `#0099E0` | `#00B2FF` |
| `color-action-primary-active` | `#0080C0` | `#0099E0` |
| `color-action-secondary` | `#7B61FF` | `#9B85FF` |
| `color-action-danger` | `#EF4444` | `#F87171` |

#### Status
| Токен | Значение |
|-------|----------|
| `color-status-success` | `#22C55E` |
| `color-status-warning` | `#F59E0B` |
| `color-status-danger` | `#EF4444` |
| `color-status-info` | `#00B2FF` |

### 2.4 Пастельные акценты (для карточек и бейджей)

| Цвет | HEX | Назначение |
|------|-----|------------|
| `pastel-purple` | `#EDE9FE` / `#3B1F7A` | Категория «Design» |
| `pastel-orange` | `#FFF7ED` / `#5C2E00` | Категория «Marketing» |
| `pastel-blue` | `#EFF6FF` / `#1E3A5F` | Категория «Dev» |
| `pastel-green` | `#ECFDF5` / `#14532D` | Категория «Business» |
| `pastel-pink` | `#FCE7F3` / `#5B1A47` | Категория «Health» |
| `pastel-teal` | `#CCFBF1` / `#134E4A` | Категория «Analytics» |

---

## 3. Типографика

Шрифт: **Inter** (fallback: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif).

### 3.1 Font Weights
| Токен | Значение |
|-------|----------|
| `font-weight-regular` | 400 |
| `font-weight-medium` | 500 |
| `font-weight-semibold` | 600 |
| `font-weight-bold` | 700 |

### 3.2 Font Size Scale (все кратны 2px, близко к 8pt ритму)
| Токен | Значение |
|-------|----------|
| `font-size-xs` | 12px |
| `font-size-sm` | 14px |
| `font-size-base` | 16px |
| `font-size-lg` | 18px |
| `font-size-xl` | 20px |
| `font-size-2xl` | 24px |
| `font-size-3xl` | 28px |
| `font-size-4xl` | 32px |
| `font-size-5xl` | 40px |

### 3.3 Line Height (multiples of 8)
| Токен | Значение |
|-------|----------|
| `line-height-tight` | 1.1 |
| `line-height-base` | 1.5 (24px при 16px шрифте) |
| `line-height-relaxed` | 1.6 |

### 3.4 Semantic Typography
| Стиль | Размер | Weight | Tracking | Line-height | Использование |
|-------|--------|--------|----------|-------------|---------------|
| `typography-heading-1` | 32px | 700 | -0.02em | 1.1 | Заголовки страниц («Good morning, John») |
| `typography-heading-2` | 24px | 600 | — | 1.2 | Секции дашборда |
| `typography-heading-3` | 20px | 600 | — | 1.3 | Подзаголовки |
| `typography-body` | 16px | 400 | — | 1.5 | Основной текст |
| `typography-body-medium` | 16px | 500 | — | 1.5 | Основной текст medium |
| `typography-caption` | 14px | 500 | — | 1.4 | Бейджи, теги, подписи |
| `typography-button` | 16px | 600 | — | 1.5 | Текст кнопок |
| `typography-metric` | 32px | 700 | — | 1.1 | Крупные числа в карточках |
| `typography-metric-sm` | 20px | 600 | — | 1.2 | Мелкие числа (проценты) |

### 3.5 Monospace
| Токен | Значение | Использование |
|-------|----------|---------------|
| `font-family-mono` | "SF Mono", ui-monospace, monospace | Коды, ID, технические данные |

---

## 4. Сетка и spacing (8pt Grid)

**Базовый шаг: 8px.** Все размеры кратны 4 (минимум) или 8 (основа).

### 4.1 Spacing Scale
| Токен | Значение | Использование |
|-------|----------|---------------|
| `space-0` | 0px | — |
| `space-1` | 4px | Очень плотные элементы, иконки |
| `space-2` | 8px | Gap между мелкими элементами |
| `space-3` | 12px | Padding внутри кнопок |
| `space-4` | 16px | Padding карточек, gap секций |
| `space-5` | 24px | Gap между карточками |
| `space-6` | 32px | Margin секций, padding карточек |
| `space-7` | 40px | — |
| `space-8` | 48px | Отступы крупных блоков |
| `space-9` | 56px | — |
| `space-10` | 64px | Глобальные отступы |
| `space-12` | 96px | — |
| `space-16` | 128px | — |

### 4.2 Semantic Spacing
| Токен | Значение | Использование |
|-------|----------|---------------|
| `space-component-padding` | 32px (`space-6`) | Внутренний отступ карточек |
| `space-card-padding` | 24-32px | Padding карточек |
| `space-section-gap` | 48-64px | Отступы между секциями |
| `space-element-gap` | 16px (`space-4`) | Между элементами внутри карточки |
| `space-inline-gap` | 12px (`space-3`) | Inline gap |

### 4.3 Layout Dimensions
| Токен | Значение | Использование |
|-------|----------|---------------|
| `size-sidebar` | 280px (collapsed: 72px) | Левая панель |
| `size-header-height` | 72px | Верхняя панель |
| `size-content-max-width` | 1440px | Контент при широком экране |

### 4.4 Grid System
- **12-колоночная сетка** для основного контента
- CSS Grid с `auto-fit` и `minmax` для адаптивности
- Gap: 16px (мелкие) / 24px (средние) / 32px (крупные)

---

## 5. Скругления (Border Radius)

| Токен | Значение | Использование |
|-------|----------|---------------|
| `radius-xs` | 4px | Очень мелкие элементы |
| `radius-sm` | 8px | Бейджи, теги, мелкие элементы |
| `radius-md` | 12px | Кнопки, чипсы, input (основной) |
| `radius-lg` | 16px | Средние карточки |
| `radius-xl` | 20px | Крупные карточки |
| `radius-2xl` | 24px | **Основной для карточек** — Eduhouse, Clarity, Alutem |
| `radius-full` | 9999px | Аватары, pill-кнопки, прогресс-бары |

---

## 6. Тени (Shadow / Elevation)

### 6.1 Primitive Shadows
| Токен | Значение |
|-------|----------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.05)` |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.06)` |
| `shadow-lg` | `0 10px 30px rgba(0,0,0,0.08)` |
| `shadow-xl` | `0 20px 50px rgba(0,0,0,0.10)` |

### 6.2 Semantic Shadows
| Токен | Значение | Использование |
|-------|----------|---------------|
| `shadow-card` | `shadow-lg` | Карточки (основная тень) |
| `shadow-popover` | `shadow-xl` | Модалки, dropdown |
| `shadow-button-hover` | `0 4px 12px rgba(0,178,255,0.25)` | Primary кнопка при hover |

### 6.3 Правила использования
- Только **одна мягкая тень** `shadow-lg` для карточек
- Inner glow на активных элементах
- Hover-эффекты: лёгкий scale 1.02 + поднятие тени

---

## 7. Компоненты

### 7.1 Layout

| Компонент | Описание | Размеры |
|-----------|----------|---------|
| `UiAppLayout` | Корневой layout: sidebar + main content area | — |
| `UiSidebar` | Левая навигация с иконками + текстом, collapsible | 280px (expanded) / 72px (collapsed) |
| `UiTopBar` | Поиск, уведомления, профиль — горизонтальная панель | height: 72px |
| `UiDashboardGrid` | Адаптивная сетка карточек (CSS Grid, auto-fit, 12-col) | max-width: 1440px |
| `UiPageHeader` | Заголовок страницы + breadcrumbs + действия | — |

**Поведение sidebar:**
- `lg+` (≥1024px): фиксированный, видимый
- `< lg`: скрыт, открывается по кнопке (overlay)
- Мобильная адаптация: sidebar → bottom navigation или hamburger

### 7.2 Навигация

| Компонент | Описание |
|-----------|----------|
| `SidebarNav` | Список секций (General / Tools) с иконками |
| `SidebarNavItem` | Элемент навигации: иконка + label + optional badge |
| `TabBar` | Горизонтальные табы (Overview / Document / Messages) |
| `Breadcrumbs` | Путь: Portal > Dashboard |
| `TopNav` | Pill-табы для быстрого переключения контекстов |

### 7.3 Карточки

| Компонент | Описание | Размеры |
|-----------|----------|---------|
| `UiCard` | Базовая карточка: padding, shadow, radius | radius: 24px, padding: 32px, shadow: `shadow-card` |
| `UiStatCard` | Карточка-метрика: иконка + большое число + подпись + trend | — |
| `UiMetricCard` | Карточка с графиком/прогрессом (blood pressure, temperature) | — |
| `UiInfoCard` | Карточка с изображением/иллюстрацией (course, mentor) | — |
| `UiActionCard` | Карточка-кнопка с CTA (Upgrade to Pro, Consult Now) | — |
| `UiProfileCard` | Карточка пользователя: аватар + имя + роль | — |

**Card style:**
- Закругление 20-24px, белый фон, мягкая тень `0 10px 30px rgba(0,0,0,0.08)`
- Hover: scale 1.02 + поднятие тени

### 7.4 Формы и ввод

| Компонент | Описание |
|-----------|----------|
| `Input` | Текстовый input с иконкой поиска |
| `Select` | Dropdown с pill-стилем |
| `SearchInput` | Input с иконкой лупы, rounded-full |
| `TextArea` | Многострочное поле |
| `Checkbox` | Кастомный checkbox с rounded corners |
| `Toggle` | Переключатель on/off |
| `DatePicker` | Календарь в стиле pill (апрель 2026) |

### 7.5 Кнопки

| Компонент | Описание | Размеры |
|-----------|----------|---------|
| `UiButton` | Базовая кнопка: primary / secondary / ghost / danger | height: 48px, radius: 12px, padding-x: 32px |
| `UiButtonGroup` | Группа связанных кнопок (pill-табы) | — |
| `UiIconButton` | Кнопка-иконка (notifications, settings) | 40x40px / 48x48px |
| `UiFloatingButton` | Кнопка с иконкой + (Add widget, Add member) | radius: full |

**Button variants:**
- **Primary**: заливной `#00B2FF`, radius 12px, height 48px — «Upgrade to Pro», «Consult Now»
- **Secondary**: обводка или ghost, radius 12px — «Follow», «Add member»
- **Ghost**: прозрачный фон, только текст
- **Danger**: красный `#EF4444`

**Hover-эффекты:**
- Лёгкий scale 1.02 + поднятие тени `shadow-button-hover`

### 7.6 Данные и визуализация

| Компонент | Описание |
|-----------|----------|
| `Badge` | Цветной бейдж: Design / Internal Tasks / Dev |
| `Tag` | Тег с иконкой (категория курса) |
| `ProgressBar` | Горизонтальный прогресс (Course in Progress) |
| `CircularProgress` | Круговой прогресс (donut chart) |
| `Sparkline` | Мини-график в карточке метрики |
| `BarChart` | Столбчатая диаграмма (hiring statistics) |
| `LineChart` | Линейный график (blood pressure over time) |
| `DonutChart` | Кольцевая диаграмма (payments breakdown) |
| `CalendarView` | Месячный календарь с событиями |
| `Timeline` | Вертикальная timeline событий |
| `KanbanColumn` | Колонка канбан-доски (To do / In progress) |
| `KanbanCard` | Карточка задачи в канбане |
| `Avatar` | Аватар пользователя: круглый, с fallback |
| `AvatarGroup` | Группа перекрывающихся аватаров |

### 7.7 Обратная связь

| Компонент | Описание |
|-----------|----------|
| `Toast` | Всплывающее уведомление (success / error / warning / info) |
| `Alert` | Встроенное предупреждение в контент |
| `Skeleton` | Загрузочный placeholder |
| `EmptyState` | Состояние «нет данных» с иллюстрацией |

### 7.8 Оверлеи

| Компонент | Описание |
|-----------|----------|
| `UiModal` | Модальное окно с backdrop |
| `UiDropdown` | Выпадающее меню |
| `UiTooltip` | Подсказка при hover |
| `UiPopover` | Панель с дополнительным контентом |

### 7.9 Таблица стилей компонентов (Component Tokens)

| Компонент | Токен | Значение |
|-----------|-------|----------|
| **Button** | `button-primary-bg` | `color-action-primary` (#00B2FF) |
| | `button-primary-hover-bg` | `color-action-primary-hover` (#0099E0) |
| | `button-height` | 48px |
| | `button-radius` | `radius-md` (12px) |
| | `button-padding-x` | `space-6` (32px) |
| **Card** | `card-bg` | `color-bg-card` |
| | `card-radius` | `radius-2xl` (24px) |
| | `card-padding` | `space-6` (32px) |
| | `card-shadow` | `shadow-card` |
| **Input** | `input-height` | 48px |
| | `input-radius` | `radius-md` (12px) |
| | `input-border` | `color-border` |
| | `input-focus-border` | `color-action-primary` |
| **Progress Bar** | `progress-radius` | `radius-full` (полностью закруглённый) |
| | `progress-height` | 8px |
| **Avatar** | `avatar-size` | 40px (sm) / 48px (md) / 64px (lg) |
| | `avatar-border` | 2px solid `color-border` |
| **Table** | `table-row-hover` | `#F8FAFC` |
| | `table-padding` | `space-4` (16px) |
| **Badge** | `badge-radius` | `radius-sm` (8px) |
| | `badge-padding` | `space-1` 4px / `space-2` 8px |
| | `badge-font-size` | `font-size-xs` (12px) |

---

## 8. Паттерны страниц (референсные сценарии)

Ниже — типовые шаблоны дашбордов из референсов. Для **game_life** на первом плане: дашборд игрока, списки (события, финансы, активность), карточки действий; остальное подключается по roadmap.

### 8.1 Dashboard
- Приветствие пользователя («Good morning, John»)
- Ряд StatCard с ключевыми метриками
- Графики и визуализации
- Быстрые действия (Add widget, Add report)

### 8.2 List / Table Page
- Заголовок + фильтры + сортировка
- Таблица или список карточек
- Пагинация

### 8.3 Detail Page
- Breadcrumbs
- Заголовок сущности
- Секции с информацией (карточки, списки)
- Действия (edit, delete, share)

### 8.4 Kanban / Board
- Колонки со статусами
- Перетаскиваемые карточки задач
- Счётчики в заголовках колонок

### 8.5 Calendar
- Месячный / недельный вид
- События с цветовой кодировкой
- Боковая панель с деталями

### 8.6 Settings / Profile
- Табы или sidebar-навигация
- Формы с группами полей
- Аватар и информация пользователя

---

## 9. Структура файлов дизайн-системы

Целевая раскладка в репозитории (Nuxt, `srcDir: 'src/'`). Стили — **фактически** под `src/assets/scss/`; опциональный `tokens.css` добавляют, если нужны чистые CSS variables без сборки SCSS.

```
src/
├── assets/
│   └── scss/
│       ├── variables.scss      # Токены (источник правды сейчас)
│       ├── mixins.scss
│       ├── reset.scss
│       ├── global.scss
│       ├── transitions.scss
│       └── tokens.css           # опционально: дубль семантики в CSS variables
├── components/
│   ├── ui/                      # Переиспользуемый UI (сейчас: GameButton, Modal, Toast…)
│   │   ├── button/
│   │   │   ├── UiButton.vue     # целевое имя; до миграции — сосуществование с GameButton.vue
│   │   │   └── UiButton.types.ts
│   │   ├── card/
│   │   │   ├── UiCard.vue
│   │   │   ├── UiStatCard.vue
│   │   │   ├── UiMetricCard.vue
│   │   │   └── UiActionCard.vue
│   │   ├── input/
│   │   │   ├── UiInput.vue
│   │   │   ├── UiSearchInput.vue
│   │   │   └── UiSelect.vue
│   │   ├── navigation/
│   │   │   ├── UiSidebar.vue
│   │   │   ├── UiSidebarNav.vue
│   │   │   ├── UiTabBar.vue
│   │   │   └── UiBreadcrumbs.vue
│   │   ├── data-display/
│   │   │   ├── UiBadge.vue
│   │   │   ├── UiTag.vue
│   │   │   ├── UiProgressBar.vue
│   │   │   ├── UiAvatar.vue
│   │   │   └── UiAvatarGroup.vue
│   │   ├── charts/
│   │   │   ├── UiSparkline.vue
│   │   │   ├── UiBarChart.vue
│   │   │   ├── UiLineChart.vue
│   │   │   └── UiDonutChart.vue
│   │   ├── feedback/
│   │   │   ├── UiToast.vue
│   │   │   ├── UiAlert.vue
│   │   │   └── UiSkeleton.vue
│   │   ├── overlay/
│   │   │   ├── UiModal.vue
│   │   │   ├── UiDropdown.vue
│   │   │   └── UiTooltip.vue
│   │   ├── layout/
│   │   │   ├── UiAppLayout.vue
│   │   │   ├── UiTopBar.vue
│   │   │   └── UiDashboardGrid.vue
│   │   └── index.ts             # публичный экспорт (когда появится)
│   ├── layout/                  # layout приложения (GameLayout и т.д.)
│   ├── game/                    # доменные игровые компоненты
│   └── pages/                   # компоненты, привязанные к экранам (dashboard, finance…)
├── composables/
│   ├── useToast/                # уже есть
│   ├── useTheme.ts              # опционально: обёртка над @nuxtjs/color-mode
│   └── useBreakpoint.ts         # опционально
└── pages/                       # маршруты Nuxt (`src/pages`, file-based routing)

# в корне проекта (рядом с nuxt.config.ts), при необходимости:
app.vue                          # корневой layout Nuxt; может отсутствовать, если достаточно default
```

**Интеграция с темой:** в проекте подключён `@nuxtjs/color-mode` с `dataValue: 'theme'` — на `<html>` выставляется атрибут `data-theme` (`light` / `dark`). Переопределения токенов для тёмной темы в CSS задавайте селектором `html[data-theme="dark"]` (см. §10).

---

## 10. CSS Design Tokens (tokens.css)

Пример **CSS custom properties**, согласованный с §2–§7 и с [src/assets/scss/variables.scss](src/assets/scss/variables.scss). Файл пока **опционален**: сейчас токены в основном в SCSS; при добавлении `tokens.css` подключите его в [nuxt.config.ts](nuxt.config.ts) после `reset.scss`, чтобы переменные были доступны глобально.

**Тёмная тема:** `@nuxtjs/color-mode` с `dataValue: 'theme'` задаёт на `<html>` атрибут `data-theme="light" | "dark"`. Используйте селектор `html[data-theme="dark"]` (а не только `[data-theme="dark"]`), чтобы совпадать с поведением модуля и избежать коллизий.

```css
:root {
  /* Brand / primitive */
  --color-brand-primary: #00B2FF;
  --color-brand-accent: #FF6B6B;
  --color-brand-secondary: #7B61FF;

  /* Semantic status */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #3B82F6;

  /* Light — background & surface */
  --color-bg-page: #F8F7F4;
  --color-bg-surface: #FFFFFF;
  --color-bg-card: #FFFFFF;
  --color-bg-elevated: #F1F0EB;

  --color-border: #E2E8F0;
  --color-border-subtle: #F1F0EB;

  --color-text-primary: #1F2A44;
  --color-text-secondary: #64748B;
  --color-text-tertiary: #94A3B8;

  --color-action-primary: #00B2FF;
  --color-action-primary-hover: #0099E0;
  --color-action-primary-active: #0080C0;
  --color-action-secondary: #7B61FF;
  --color-action-danger: #EF4444;

  --color-status-success: #22C55E;
  --color-status-warning: #F59E0B;
  --color-status-danger: #EF4444;
  --color-status-info: #00B2FF;

  /* Spacing (8pt grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 56px;
  --space-10: 64px;
  --space-12: 96px;
  --space-16: 128px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.1);
  --shadow-card: var(--shadow-lg);
  --shadow-button-hover: 0 4px 12px rgba(0, 178, 255, 0.25);

  /* Typography */
  --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;
  --font-size-4xl: 32px;
  --font-size-5xl: 40px;
  --typography-heading-1-size: 32px;
  --typography-metric-size: 32px;
  --typography-metric-sm-size: 20px;
}

html[data-theme="dark"] {
  --color-bg-page: #0F172A;
  --color-bg-surface: #1E2937;
  --color-bg-card: #1E2937;
  --color-bg-elevated: #242836;

  --color-border: #334155;
  --color-border-subtle: #1E2937;

  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-tertiary: #64748B;

  --color-action-primary: #33C4FF;
  --color-action-primary-hover: #00B2FF;
  --color-action-primary-active: #0099E0;
  --color-action-secondary: #9B85FF;
}
```

---

## 11. Иконки и иллюстрации

### 11.1 Иконки
- **Библиотека**: Lucide Icons или Feather (линейные, 24px, stroke 1.5-2px, rounded caps).
- **Размер**: 24px (базовый), 20px (мелкий), 32px (крупный).

**Базовый набор иконок (дашборд / игра):**
- Навигация: `home`, `dashboard`, `calendar`, `users`, `settings`, `bell`, `search`
- Действия: `plus`, `edit`, `trash`, `download`, `upload`, `filter`, `sort`
- Навигация UI: `check`, `x`, `chevron-right`, `chevron-down`, `more-horizontal`
- Данные: `heart`, `star`, `trending-up`, `trending-down`
- Коммуникации: `mail`, `phone`, `message`, `file`, `folder`
- Тема: `sun`, `moon` (для переключения light/dark)

### 11.2 Иллюстрации
- **Стиль**: 3D-градиентные объекты (как сердце в MagicHeal, тело в Alutem, глобус в Eduhouse).
- **Цветовая гамма**: Primary (`#00B2FF`) + Accent (`#FF6B6B`) + Secondary (`#7B61FF`).
- **Empty states**: красивые 3D-иллюстрации + текст.

### 11.3 Правила и лучшие практики
- **Радиусы**: 8px (мелкие элементы), 12px (кнопки), 20-24px (карточки).
- **Тени**: только одна мягкая `0 10px 30px rgba(0,0,0,0.08)` + inner glow на активных элементах.
- **Hover-эффекты**: лёгкий scale 1.02 + поднятие тени.
- **Анимации**: 200-300ms ease-out (CSS transitions / Framer Motion).
- **Все размеры кратны 8pt grid**.

---

## 12. Адаптивность

| Breakpoint | Значение | Использование |
|------------|----------|---------------|
| `sm` | 640px | Мобильные |
| `md` | 768px | Планшеты |
| `lg` | 1024px | Маленькие десктопы |
| `xl` | 1280px | Десктопы |
| `2xl` | 1536px | Большие экраны |

**Поведение sidebar:**
- `lg+`: фиксированный, видимый (280px)
- `< lg`: скрыт, открывается по кнопке (overlay)
- Мобильная адаптация: sidebar → bottom navigation или hamburger

**Поведение DashboardGrid:**
- `sm`: 1 колонка
- `md`: 2 колонки
- `lg`: 3 колонки
- `xl+`: 4 колонки

---

## 13. План реализации

Порядок сохранён (foundation → UI → layout → данные → feedback → полировка). Ниже — **корректировка под текущий репозиторий** и **приоритизация для game_life**.

### Этап 0: Design Tokens в Figma (опционально)
1. Создать Figma-файл Design System (Tokens + Components), если команда ведёт макеты в Figma.
2. Variables / Figma Tokens с Modes: Light / Dark; имена в духе `color/bg/page`, `space/component/padding`, `typography/heading/1`.
3. Референсные экраны: достаточно 2–3 ключевых для игры (home dashboard, карточка события, список); полный набор админ-макетов — по необходимости.

### Этап 1: Foundation (tokens + base) — частично выполнено
1. Поддерживать единый источник в `src/assets/scss/variables.scss`; при появлении `src/assets/scss/tokens.css` — **дублировать те же значения**, что в §10 (без расхождений).
2. База уже подключена: `reset.scss`, `global.scss`, `transitions.scss` в `nuxt.config.ts`.
3. Шрифт Inter уже подключается через `app.head` в `nuxt.config.ts`.
4. Экспорт в Figma / Style Dictionary — только если появится конвейер «дизайн → код».

### Этап 1b: Аудит и стратегия `components/ui`
1. Зафиксировать текущие примитивы: `GameButton`, `Modal`, `Toast`, `Tooltip`, `ProgressBar`, `RoundedPanel` и т.д.
2. Решить для каждого: **переименовать/обернуть в `Ui*`** или оставить доменные имена до следующей итерации.
3. Ввести `src/components/ui/index.ts` по мере стабилизации публичного API.

### Этап 2: Core UI компоненты (приоритет для игры)
1. Кнопка, инпуты, бейджи, базовая карточка — максимальный приоритет (переиспользование на всех `game/*` экранах).
2. `UiProgressBar` / круговой прогресс — по мере появления метрик на экранах.
3. `UiTable` — низкий приоритет, пока нет табличных экранов.

### Этап 3: Layout компоненты
1. Согласовать с существующим `GameLayout` / навигацией: не плодить второй несовместимый каркас.
2. Полноценный `UiAppLayout` + сайдбар 280px — если появится отдельный «рабочий стол» или админ-зона; иначе отложить.

### Этап 4: Data Display (по roadmap)
Графики, Kanban, календарь в стиле референсов — **только при появлении фич** (отдельные задачи с выбором библиотеки чартов / DnD). Не блокирует базовый игровой UI.

### Этап 5: Feedback & Overlay
1. `useToast` и обвязка toast уже есть — выровнять внешний вид под токены §2–§6.
2. `Modal`, `EmptyState` — довести до единых радиусов/теней с `UiCard`.
3. Остальное по необходимости.

### Этап 6: Theme, Animations & Polish
1. Тёмная тема: опираться на `@nuxtjs/color-mode` и `html[data-theme="dark"]` (или класс `.dark`, если переключите стратегию модуля — обновите §9–§10).
2. Утилиты переходов: уже есть `transitions.scss`; расширять по месту.
3. Storybook / Zeroheight / демо-страница компонентов — отдельная инициатива (после ядра `Ui*`).

---

## 14. Примеры использования

Импорты и композиция ниже — **целевое состояние** после появления `Ui*` и `index.ts` в `components/ui`. До этого используйте существующие компоненты (`GameLayout`, `GameButton`, …) и те же токены из SCSS.

### Dashboard страница
```vue
<script setup lang="ts">
import { UiAppLayout, UiTopBar, UiDashboardGrid, UiStatCard, UiMetricCard } from '@/components/ui'
</script>

<template>
  <UiAppLayout>
    <UiTopBar />
    <main class="p-6">
      <h1 class="text-display font-bold text-primary">Good morning, Alex</h1>

      <UiDashboardGrid :cols="4">
        <UiStatCard
          icon="users"
          :value="120"
          label="Total members"
          trend="+5%"
          trend-type="up"
        />
        <UiStatCard
          icon="clock"
          :value="46.5"
          label="Avg hours/week"
          trend="+0.5%"
          trend-type="up"
        />
        <UiMetricCard
          title="Heart Rate"
          :value="92"
          unit="avg bpm"
          :data="[80, 85, 92, 88, 95, 90, 92]"
        />
        <UiActionCard
          title="Upgrade to Pro"
          description="You have 5 days left"
          cta="Upgrade"
          cta-type="primary"
        />
      </UiDashboardGrid>
    </main>
  </UiAppLayout>
</template>
```

---

## 15. Критерии качества

| Критерий | Требование |
|----------|------------|
| **Доступность** | Контраст ≥ 4.5:1, keyboard navigation, aria-атрибуты, большие кликабельные области |
| **Производительность** | CSS tokens без JS, lazy-load charts, tree-shaking компонентов |
| **Тестируемость** | Unit-тесты для каждого UI-компонента |
| **Документация** | TSDoc для каждого компонента, Storybook / Zeroheight |
| **Theming** | Переключение light/dark через CSS tokens, Variables в Figma с Modes |
| **Адаптивность** | Все компоненты работают от 320px до 2560px |
| **Consistency** | Все размеры кратны 8pt grid, единые токены цветов |

## 16. Рекомендации по использованию токенов

### В Figma
- Используйте **Variables** с Modes: Light / Dark.
- Naming convention:
  - `color/bg/page` — фон страницы
  - `space/component/padding` — padding компонента
  - `typography/heading/1` — заголовок 1 уровня
  - `radius/card` — скругление карточки
  - `shadow/card` — тень карточки

### В коде (CSS / Tailwind / SCSS)
- Экспорт через **Tokens Studio** или **Style Dictionary** (если настроен конвейер).
- CSS Custom Properties — опционально в `src/assets/scss/tokens.css` (см. §10).
- SCSS-переменные — [src/assets/scss/variables.scss](src/assets/scss/variables.scss) (основной слой сейчас).
- Tailwind — только если подключите его в проект; сейчас стиль ведётся через SCSS.

### Именование
- **Primitive**: `color-brand-primary-500`, `color-neutral-800`
- **Semantic**: `color-bg-page`, `color-text-primary`, `color-action-primary`
- **Component**: `button-primary-bg`, `card-radius`, `input-height`

---

## 17. Источники референсов

Дизайн-система основана на визуальных референсах из `artifact/`:

| # | Название | Что взято |
|---|----------|-----------|
| 1 | **Eduhouse** | Sidebar с иконками, карточки курсов, pastel colors, прогресс-бары |
| 2 | **MagicHeal** | Health dashboard, 3D-сердце, графики, карточки метрик |
| 3 | **Clarity** | Kanban-доска, pastel карточки задач, счётчики |
| 4 | **Collaboration Dashboard** | Members, statistics, calendar, notifications |
| 5 | **Lordbank** | HR/Team dashboard, графики hiring, profile cards |
| 6 | **Health+** | Body diagnosis, calendar appointments, health metrics |
| 7 | **M+ Health** | Hierarchy & Spacing principles, 8pt grid, body condition cards |
| 8 | **MindMate** | Wellness dashboard, mood tracking, activity suggestions |
| 9 | **YourEducation** | Course cards, activity charts, profile sidebar |
| 10 | **Alutem** | Health dashboard, 3D-body, metrics, heart rate chart |
| 11 | **Intelly** | Billing dashboard, dark sidebar, calendar events, donut chart |

---

## 18. Чеклист согласованности с репозиторием

Используйте при ревью дизайна и перед крупными UI-изменениями:

| Проверка | Действие |
|----------|----------|
| Значения цветов / spacing | Сверить §2–§7 и §10 с `variables.scss` |
| Тёмная тема | Селектор совпадает с `@nuxtjs/color-mode` (`dataValue: 'theme'` → `html[data-theme="dark"]`) |
| Подключение стилей | Список в `nuxt.config.ts` → `css: [...]` |
| Новые UI-примитивы | Не дублировать: расширить `components/ui` или доменный компонент осознанно |
| Путь в правилах редактора | В [.cursor/rules/40-styles.mdc](.cursor/rules/40-styles.mdc) указывайте актуальный глобальный SCSS (`src/assets/scss/global.scss`), если правило ссылается на стили |
