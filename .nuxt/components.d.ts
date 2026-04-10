
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


export const BottomNav: typeof import("../src/components/global/BottomNav/BottomNav.vue")['default']
export const GameActionCard: typeof import("../src/components/game/ActionCard/ActionCard.vue")['default']
export const GameActionCardList: typeof import("../src/components/game/ActionCardList/ActionCardList.vue")['default']
export const GameEmptyState: typeof import("../src/components/game/EmptyState/EmptyState.vue")['default']
export const GameSectionHeader: typeof import("../src/components/game/SectionHeader/SectionHeader.vue")['default']
export const GameStatBar: typeof import("../src/components/game/StatBar.vue")['default']
export const LayoutGameLayout: typeof import("../src/components/layout/GameLayout/GameLayout.vue")['default']
export const PagesActivityActivityFilter: typeof import("../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']
export const PagesActivityActivityLogList: typeof import("../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']
export const PagesCareerCareerTrack: typeof import("../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']
export const PagesCareerCurrentJobPanel: typeof import("../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']
export const PagesCareerWorkShiftPanel: typeof import("../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']
export const PagesDashboardActivityLogCard: typeof import("../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']
export const PagesDashboardGameNav: typeof import("../src/components/pages/dashboard/GameNav/GameNav.vue")['default']
export const PagesDashboardHomePreview: typeof import("../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']
export const PagesDashboardProfileCard: typeof import("../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']
export const PagesDashboardStatsCard: typeof import("../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']
export const PagesDashboardWorkButton: typeof import("../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']
export const PagesEducationEducationLevel: typeof import("../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']
export const PagesEducationProgramList: typeof import("../src/components/pages/education/ProgramList/ProgramList.vue")['default']
export const PagesEventsEventCard: typeof import("../src/components/pages/events/EventCard/EventCard.vue")['default']
export const PagesEventsEventChoices: typeof import("../src/components/pages/events/EventChoices/EventChoices.vue")['default']
export const PagesEventsEventResult: typeof import("../src/components/pages/events/EventResult/EventResult.vue")['default']
export const PagesFinanceBalancePanel: typeof import("../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']
export const PagesFinanceExpenseList: typeof import("../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']
export const PagesFinanceFinanceActionList: typeof import("../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']
export const PagesSkillsSkillCard: typeof import("../src/components/pages/skills/SkillCard/SkillCard.vue")['default']
export const PagesSkillsSkillList: typeof import("../src/components/pages/skills/SkillList/SkillList.vue")['default']
export const UiGameButton: typeof import("../src/components/ui/GameButton.vue")['default']
export const UiModal: typeof import("../src/components/ui/Modal.vue")['default']
export const UiProgressBar: typeof import("../src/components/ui/ProgressBar.vue")['default']
export const UiRoundedPanel: typeof import("../src/components/ui/RoundedPanel.vue")['default']
export const UiToast: typeof import("../src/components/ui/Toast.vue")['default']
export const UiTooltip: typeof import("../src/components/ui/Tooltip.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const ColorScheme: typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue")['default']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyBottomNav: LazyComponent<typeof import("../src/components/global/BottomNav/BottomNav.vue")['default']>
export const LazyGameActionCard: LazyComponent<typeof import("../src/components/game/ActionCard/ActionCard.vue")['default']>
export const LazyGameActionCardList: LazyComponent<typeof import("../src/components/game/ActionCardList/ActionCardList.vue")['default']>
export const LazyGameEmptyState: LazyComponent<typeof import("../src/components/game/EmptyState/EmptyState.vue")['default']>
export const LazyGameSectionHeader: LazyComponent<typeof import("../src/components/game/SectionHeader/SectionHeader.vue")['default']>
export const LazyGameStatBar: LazyComponent<typeof import("../src/components/game/StatBar.vue")['default']>
export const LazyLayoutGameLayout: LazyComponent<typeof import("../src/components/layout/GameLayout/GameLayout.vue")['default']>
export const LazyPagesActivityActivityFilter: LazyComponent<typeof import("../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']>
export const LazyPagesActivityActivityLogList: LazyComponent<typeof import("../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']>
export const LazyPagesCareerCareerTrack: LazyComponent<typeof import("../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']>
export const LazyPagesCareerCurrentJobPanel: LazyComponent<typeof import("../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']>
export const LazyPagesCareerWorkShiftPanel: LazyComponent<typeof import("../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']>
export const LazyPagesDashboardActivityLogCard: LazyComponent<typeof import("../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']>
export const LazyPagesDashboardGameNav: LazyComponent<typeof import("../src/components/pages/dashboard/GameNav/GameNav.vue")['default']>
export const LazyPagesDashboardHomePreview: LazyComponent<typeof import("../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']>
export const LazyPagesDashboardProfileCard: LazyComponent<typeof import("../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']>
export const LazyPagesDashboardStatsCard: LazyComponent<typeof import("../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']>
export const LazyPagesDashboardWorkButton: LazyComponent<typeof import("../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']>
export const LazyPagesEducationEducationLevel: LazyComponent<typeof import("../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']>
export const LazyPagesEducationProgramList: LazyComponent<typeof import("../src/components/pages/education/ProgramList/ProgramList.vue")['default']>
export const LazyPagesEventsEventCard: LazyComponent<typeof import("../src/components/pages/events/EventCard/EventCard.vue")['default']>
export const LazyPagesEventsEventChoices: LazyComponent<typeof import("../src/components/pages/events/EventChoices/EventChoices.vue")['default']>
export const LazyPagesEventsEventResult: LazyComponent<typeof import("../src/components/pages/events/EventResult/EventResult.vue")['default']>
export const LazyPagesFinanceBalancePanel: LazyComponent<typeof import("../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']>
export const LazyPagesFinanceExpenseList: LazyComponent<typeof import("../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']>
export const LazyPagesFinanceFinanceActionList: LazyComponent<typeof import("../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']>
export const LazyPagesSkillsSkillCard: LazyComponent<typeof import("../src/components/pages/skills/SkillCard/SkillCard.vue")['default']>
export const LazyPagesSkillsSkillList: LazyComponent<typeof import("../src/components/pages/skills/SkillList/SkillList.vue")['default']>
export const LazyUiGameButton: LazyComponent<typeof import("../src/components/ui/GameButton.vue")['default']>
export const LazyUiModal: LazyComponent<typeof import("../src/components/ui/Modal.vue")['default']>
export const LazyUiProgressBar: LazyComponent<typeof import("../src/components/ui/ProgressBar.vue")['default']>
export const LazyUiRoundedPanel: LazyComponent<typeof import("../src/components/ui/RoundedPanel.vue")['default']>
export const LazyUiToast: LazyComponent<typeof import("../src/components/ui/Toast.vue")['default']>
export const LazyUiTooltip: LazyComponent<typeof import("../src/components/ui/Tooltip.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyColorScheme: LazyComponent<typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue")['default']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
