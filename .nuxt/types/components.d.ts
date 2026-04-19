
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
  GameNav: typeof import("../../src/components/global/GameNav/GameNav.vue")['default']
  ActionCard: typeof import("../../src/components/game/ActionCard/ActionCard.vue")['default']
  ActionCardList: typeof import("../../src/components/game/ActionCardList/ActionCardList.vue")['default']
  ActionTabs: typeof import("../../src/components/game/ActionTabs/ActionTabs.vue")['default']
  EmptyState: typeof import("../../src/components/game/EmptyState/EmptyState.vue")['default']
  IndustryFilter: typeof import("../../src/components/game/IndustryFilter/IndustryFilter.vue")['default']
  NewbornWelcomeScreen: typeof import("../../src/components/game/NewbornWelcomeScreen/index.vue")['default']
  SectionHeader: typeof import("../../src/components/game/SectionHeader/SectionHeader.vue")['default']
  StatBar: typeof import("../../src/components/game/StatBar.vue")['default']
  WorkTabs: typeof import("../../src/components/game/WorkTabs/WorkTabs.vue")['default']
  GameButton: typeof import("../../src/components/ui/GameButton/index.vue")['default']
  GameModalHost: typeof import("../../src/components/ui/GameModalHost/GameModalHost.vue")['default']
  Modal: typeof import("../../src/components/ui/Modal/index.vue")['default']
  ModalConstants: typeof import("../../src/components/ui/Modal/modal.constants")['default']
  ModalStackHost: typeof import("../../src/components/ui/ModalStackHost/ModalStackHost.vue")['default']
  ProgressBar: typeof import("../../src/components/ui/ProgressBar/index.vue")['default']
  RoundedPanel: typeof import("../../src/components/ui/RoundedPanel/index.vue")['default']
  StatChange: typeof import("../../src/components/ui/StatChange/StatChange.vue")['default']
  IndexConstants: typeof import("../../src/components/ui/Toast/index.constants")['default']
  Toast: typeof import("../../src/components/ui/Toast/index.vue")['default']
  Tooltip: typeof import("../../src/components/ui/Tooltip/index.vue")['default']
  GameLayout: typeof import("../../src/components/layout/GameLayout/GameLayout.vue")['default']
  ActivityFilter: typeof import("../../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']
  ActivityLogList: typeof import("../../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']
  CareerTrack: typeof import("../../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']
  CurrentJobPanel: typeof import("../../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']
  WorkShiftPanel: typeof import("../../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']
  ActivityLogCard: typeof import("../../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']
  HomePreview: typeof import("../../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']
  ProfileCard: typeof import("../../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']
  SkillsModal: typeof import("../../src/components/pages/dashboard/SkillsModal/SkillsModal.vue")['default']
  StatsCard: typeof import("../../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']
  WorkButtonTypes: typeof import("../../src/components/pages/dashboard/WorkButton/WorkButton.types")['default']
  WorkButton: typeof import("../../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']
  WorkChoiceModal: typeof import("../../src/components/pages/dashboard/WorkChoiceModal/WorkChoiceModal.vue")['default']
  WorkResultModal: typeof import("../../src/components/pages/dashboard/WorkResultModal/WorkResultModal.vue")['default']
  EducationLevel: typeof import("../../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']
  ProgramList: typeof import("../../src/components/pages/education/ProgramList/ProgramList.vue")['default']
  StudyModal: typeof import("../../src/components/pages/education/StudyModal/StudyModal.vue")['default']
  EventCard: typeof import("../../src/components/pages/events/EventCard/EventCard.vue")['default']
  EventChoices: typeof import("../../src/components/pages/events/EventChoices/EventChoices.vue")['default']
  EventModal: typeof import("../../src/components/pages/events/EventModal/EventModal.vue")['default']
  EventResult: typeof import("../../src/components/pages/events/EventResult/EventResult.vue")['default']
  BalancePanel: typeof import("../../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']
  ExpenseList: typeof import("../../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']
  FinanceActionList: typeof import("../../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']
  SkillCard: typeof import("../../src/components/pages/skills/SkillCard/SkillCard.vue")['default']
  SkillList: typeof import("../../src/components/pages/skills/SkillList/SkillList.vue")['default']
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
  LazyGameNav: LazyComponent<typeof import("../../src/components/global/GameNav/GameNav.vue")['default']>
  LazyActionCard: LazyComponent<typeof import("../../src/components/game/ActionCard/ActionCard.vue")['default']>
  LazyActionCardList: LazyComponent<typeof import("../../src/components/game/ActionCardList/ActionCardList.vue")['default']>
  LazyActionTabs: LazyComponent<typeof import("../../src/components/game/ActionTabs/ActionTabs.vue")['default']>
  LazyEmptyState: LazyComponent<typeof import("../../src/components/game/EmptyState/EmptyState.vue")['default']>
  LazyIndustryFilter: LazyComponent<typeof import("../../src/components/game/IndustryFilter/IndustryFilter.vue")['default']>
  LazyNewbornWelcomeScreen: LazyComponent<typeof import("../../src/components/game/NewbornWelcomeScreen/index.vue")['default']>
  LazySectionHeader: LazyComponent<typeof import("../../src/components/game/SectionHeader/SectionHeader.vue")['default']>
  LazyStatBar: LazyComponent<typeof import("../../src/components/game/StatBar.vue")['default']>
  LazyWorkTabs: LazyComponent<typeof import("../../src/components/game/WorkTabs/WorkTabs.vue")['default']>
  LazyGameButton: LazyComponent<typeof import("../../src/components/ui/GameButton/index.vue")['default']>
  LazyGameModalHost: LazyComponent<typeof import("../../src/components/ui/GameModalHost/GameModalHost.vue")['default']>
  LazyModal: LazyComponent<typeof import("../../src/components/ui/Modal/index.vue")['default']>
  LazyModalConstants: LazyComponent<typeof import("../../src/components/ui/Modal/modal.constants")['default']>
  LazyModalStackHost: LazyComponent<typeof import("../../src/components/ui/ModalStackHost/ModalStackHost.vue")['default']>
  LazyProgressBar: LazyComponent<typeof import("../../src/components/ui/ProgressBar/index.vue")['default']>
  LazyRoundedPanel: LazyComponent<typeof import("../../src/components/ui/RoundedPanel/index.vue")['default']>
  LazyStatChange: LazyComponent<typeof import("../../src/components/ui/StatChange/StatChange.vue")['default']>
  LazyIndexConstants: LazyComponent<typeof import("../../src/components/ui/Toast/index.constants")['default']>
  LazyToast: LazyComponent<typeof import("../../src/components/ui/Toast/index.vue")['default']>
  LazyTooltip: LazyComponent<typeof import("../../src/components/ui/Tooltip/index.vue")['default']>
  LazyGameLayout: LazyComponent<typeof import("../../src/components/layout/GameLayout/GameLayout.vue")['default']>
  LazyActivityFilter: LazyComponent<typeof import("../../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']>
  LazyActivityLogList: LazyComponent<typeof import("../../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']>
  LazyCareerTrack: LazyComponent<typeof import("../../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']>
  LazyCurrentJobPanel: LazyComponent<typeof import("../../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']>
  LazyWorkShiftPanel: LazyComponent<typeof import("../../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']>
  LazyActivityLogCard: LazyComponent<typeof import("../../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']>
  LazyHomePreview: LazyComponent<typeof import("../../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']>
  LazyProfileCard: LazyComponent<typeof import("../../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']>
  LazySkillsModal: LazyComponent<typeof import("../../src/components/pages/dashboard/SkillsModal/SkillsModal.vue")['default']>
  LazyStatsCard: LazyComponent<typeof import("../../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']>
  LazyWorkButtonTypes: LazyComponent<typeof import("../../src/components/pages/dashboard/WorkButton/WorkButton.types")['default']>
  LazyWorkButton: LazyComponent<typeof import("../../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']>
  LazyWorkChoiceModal: LazyComponent<typeof import("../../src/components/pages/dashboard/WorkChoiceModal/WorkChoiceModal.vue")['default']>
  LazyWorkResultModal: LazyComponent<typeof import("../../src/components/pages/dashboard/WorkResultModal/WorkResultModal.vue")['default']>
  LazyEducationLevel: LazyComponent<typeof import("../../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']>
  LazyProgramList: LazyComponent<typeof import("../../src/components/pages/education/ProgramList/ProgramList.vue")['default']>
  LazyStudyModal: LazyComponent<typeof import("../../src/components/pages/education/StudyModal/StudyModal.vue")['default']>
  LazyEventCard: LazyComponent<typeof import("../../src/components/pages/events/EventCard/EventCard.vue")['default']>
  LazyEventChoices: LazyComponent<typeof import("../../src/components/pages/events/EventChoices/EventChoices.vue")['default']>
  LazyEventModal: LazyComponent<typeof import("../../src/components/pages/events/EventModal/EventModal.vue")['default']>
  LazyEventResult: LazyComponent<typeof import("../../src/components/pages/events/EventResult/EventResult.vue")['default']>
  LazyBalancePanel: LazyComponent<typeof import("../../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']>
  LazyExpenseList: LazyComponent<typeof import("../../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']>
  LazyFinanceActionList: LazyComponent<typeof import("../../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']>
  LazySkillCard: LazyComponent<typeof import("../../src/components/pages/skills/SkillCard/SkillCard.vue")['default']>
  LazySkillList: LazyComponent<typeof import("../../src/components/pages/skills/SkillList/SkillList.vue")['default']>
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
