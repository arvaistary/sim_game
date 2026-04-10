
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  BottomNav: typeof import("../../src/components/global/BottomNav/BottomNav.vue")['default']
  GameActionCard: typeof import("../../src/components/game/ActionCard/ActionCard.vue")['default']
  GameActionCardList: typeof import("../../src/components/game/ActionCardList/ActionCardList.vue")['default']
  GameEmptyState: typeof import("../../src/components/game/EmptyState/EmptyState.vue")['default']
  GameSectionHeader: typeof import("../../src/components/game/SectionHeader/SectionHeader.vue")['default']
  GameStatBar: typeof import("../../src/components/game/StatBar.vue")['default']
  LayoutGameLayout: typeof import("../../src/components/layout/GameLayout/GameLayout.vue")['default']
  PagesActivityActivityFilter: typeof import("../../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']
  PagesActivityActivityLogList: typeof import("../../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']
  PagesCareerCareerTrack: typeof import("../../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']
  PagesCareerCurrentJobPanel: typeof import("../../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']
  PagesCareerWorkShiftPanel: typeof import("../../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']
  PagesDashboardActivityLogCard: typeof import("../../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']
  PagesDashboardGameNav: typeof import("../../src/components/pages/dashboard/GameNav/GameNav.vue")['default']
  PagesDashboardHomePreview: typeof import("../../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']
  PagesDashboardProfileCard: typeof import("../../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']
  PagesDashboardStatsCard: typeof import("../../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']
  PagesDashboardWorkButton: typeof import("../../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']
  PagesEducationEducationLevel: typeof import("../../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']
  PagesEducationProgramList: typeof import("../../src/components/pages/education/ProgramList/ProgramList.vue")['default']
  PagesEventsEventCard: typeof import("../../src/components/pages/events/EventCard/EventCard.vue")['default']
  PagesEventsEventChoices: typeof import("../../src/components/pages/events/EventChoices/EventChoices.vue")['default']
  PagesEventsEventResult: typeof import("../../src/components/pages/events/EventResult/EventResult.vue")['default']
  PagesFinanceBalancePanel: typeof import("../../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']
  PagesFinanceExpenseList: typeof import("../../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']
  PagesFinanceFinanceActionList: typeof import("../../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']
  PagesSkillsSkillCard: typeof import("../../src/components/pages/skills/SkillCard/SkillCard.vue")['default']
  PagesSkillsSkillList: typeof import("../../src/components/pages/skills/SkillList/SkillList.vue")['default']
  UiGameButton: typeof import("../../src/components/ui/GameButton.vue")['default']
  UiModal: typeof import("../../src/components/ui/Modal.vue")['default']
  UiProgressBar: typeof import("../../src/components/ui/ProgressBar.vue")['default']
  UiRoundedPanel: typeof import("../../src/components/ui/RoundedPanel.vue")['default']
  UiToast: typeof import("../../src/components/ui/Toast.vue")['default']
  UiTooltip: typeof import("../../src/components/ui/Tooltip.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  ColorScheme: typeof import("../../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue")['default']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyBottomNav: LazyComponent<typeof import("../../src/components/global/BottomNav/BottomNav.vue")['default']>
  LazyGameActionCard: LazyComponent<typeof import("../../src/components/game/ActionCard/ActionCard.vue")['default']>
  LazyGameActionCardList: LazyComponent<typeof import("../../src/components/game/ActionCardList/ActionCardList.vue")['default']>
  LazyGameEmptyState: LazyComponent<typeof import("../../src/components/game/EmptyState/EmptyState.vue")['default']>
  LazyGameSectionHeader: LazyComponent<typeof import("../../src/components/game/SectionHeader/SectionHeader.vue")['default']>
  LazyGameStatBar: LazyComponent<typeof import("../../src/components/game/StatBar.vue")['default']>
  LazyLayoutGameLayout: LazyComponent<typeof import("../../src/components/layout/GameLayout/GameLayout.vue")['default']>
  LazyPagesActivityActivityFilter: LazyComponent<typeof import("../../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']>
  LazyPagesActivityActivityLogList: LazyComponent<typeof import("../../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']>
  LazyPagesCareerCareerTrack: LazyComponent<typeof import("../../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']>
  LazyPagesCareerCurrentJobPanel: LazyComponent<typeof import("../../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']>
  LazyPagesCareerWorkShiftPanel: LazyComponent<typeof import("../../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']>
  LazyPagesDashboardActivityLogCard: LazyComponent<typeof import("../../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']>
  LazyPagesDashboardGameNav: LazyComponent<typeof import("../../src/components/pages/dashboard/GameNav/GameNav.vue")['default']>
  LazyPagesDashboardHomePreview: LazyComponent<typeof import("../../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']>
  LazyPagesDashboardProfileCard: LazyComponent<typeof import("../../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']>
  LazyPagesDashboardStatsCard: LazyComponent<typeof import("../../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']>
  LazyPagesDashboardWorkButton: LazyComponent<typeof import("../../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']>
  LazyPagesEducationEducationLevel: LazyComponent<typeof import("../../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']>
  LazyPagesEducationProgramList: LazyComponent<typeof import("../../src/components/pages/education/ProgramList/ProgramList.vue")['default']>
  LazyPagesEventsEventCard: LazyComponent<typeof import("../../src/components/pages/events/EventCard/EventCard.vue")['default']>
  LazyPagesEventsEventChoices: LazyComponent<typeof import("../../src/components/pages/events/EventChoices/EventChoices.vue")['default']>
  LazyPagesEventsEventResult: LazyComponent<typeof import("../../src/components/pages/events/EventResult/EventResult.vue")['default']>
  LazyPagesFinanceBalancePanel: LazyComponent<typeof import("../../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']>
  LazyPagesFinanceExpenseList: LazyComponent<typeof import("../../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']>
  LazyPagesFinanceFinanceActionList: LazyComponent<typeof import("../../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']>
  LazyPagesSkillsSkillCard: LazyComponent<typeof import("../../src/components/pages/skills/SkillCard/SkillCard.vue")['default']>
  LazyPagesSkillsSkillList: LazyComponent<typeof import("../../src/components/pages/skills/SkillList/SkillList.vue")['default']>
  LazyUiGameButton: LazyComponent<typeof import("../../src/components/ui/GameButton.vue")['default']>
  LazyUiModal: LazyComponent<typeof import("../../src/components/ui/Modal.vue")['default']>
  LazyUiProgressBar: LazyComponent<typeof import("../../src/components/ui/ProgressBar.vue")['default']>
  LazyUiRoundedPanel: LazyComponent<typeof import("../../src/components/ui/RoundedPanel.vue")['default']>
  LazyUiToast: LazyComponent<typeof import("../../src/components/ui/Toast.vue")['default']>
  LazyUiTooltip: LazyComponent<typeof import("../../src/components/ui/Tooltip.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyColorScheme: LazyComponent<typeof import("../../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue")['default']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
