
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


export const GameNav: typeof import("../src/components/global/GameNav/GameNav.vue")['default']
export const ActionCard: typeof import("../src/components/game/ActionCard/ActionCard.vue")['default']
export const ActionCardList: typeof import("../src/components/game/ActionCardList/ActionCardList.vue")['default']
export const ActionTabs: typeof import("../src/components/game/ActionTabs/ActionTabs.vue")['default']
export const EmptyState: typeof import("../src/components/game/EmptyState/EmptyState.vue")['default']
export const IndustryFilter: typeof import("../src/components/game/IndustryFilter/IndustryFilter.vue")['default']
export const NewbornWelcomeScreen: typeof import("../src/components/game/NewbornWelcomeScreen/index.vue")['default']
export const SectionHeader: typeof import("../src/components/game/SectionHeader/SectionHeader.vue")['default']
export const StatBar: typeof import("../src/components/game/StatBar.vue")['default']
export const WorkTabs: typeof import("../src/components/game/WorkTabs/WorkTabs.vue")['default']
export const GameButton: typeof import("../src/components/ui/GameButton/index.vue")['default']
export const GameModalHost: typeof import("../src/components/ui/GameModalHost/GameModalHost.vue")['default']
export const Modal: typeof import("../src/components/ui/Modal/index.vue")['default']
export const ModalConstants: typeof import("../src/components/ui/Modal/modal.constants")['default']
export const ModalStackHost: typeof import("../src/components/ui/ModalStackHost/ModalStackHost.vue")['default']
export const ProgressBar: typeof import("../src/components/ui/ProgressBar/index.vue")['default']
export const RoundedPanel: typeof import("../src/components/ui/RoundedPanel/index.vue")['default']
export const StatChange: typeof import("../src/components/ui/StatChange/StatChange.vue")['default']
export const IndexConstants: typeof import("../src/components/ui/Toast/index.constants")['default']
export const Toast: typeof import("../src/components/ui/Toast/index.vue")['default']
export const Tooltip: typeof import("../src/components/ui/Tooltip/index.vue")['default']
export const GameLayout: typeof import("../src/components/layout/GameLayout/GameLayout.vue")['default']
export const ActivityFilter: typeof import("../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']
export const ActivityLogList: typeof import("../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']
export const CareerTrack: typeof import("../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']
export const CurrentJobPanel: typeof import("../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']
export const WorkShiftPanel: typeof import("../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']
export const ActivityLogCard: typeof import("../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']
export const HomePreview: typeof import("../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']
export const ProfileCard: typeof import("../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']
export const SkillsModal: typeof import("../src/components/pages/dashboard/SkillsModal/SkillsModal.vue")['default']
export const StatsCard: typeof import("../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']
export const WorkButtonTypes: typeof import("../src/components/pages/dashboard/WorkButton/WorkButton.types")['default']
export const WorkButton: typeof import("../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']
export const WorkChoiceModal: typeof import("../src/components/pages/dashboard/WorkChoiceModal/WorkChoiceModal.vue")['default']
export const WorkResultModal: typeof import("../src/components/pages/dashboard/WorkResultModal/WorkResultModal.vue")['default']
export const EducationLevel: typeof import("../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']
export const ProgramList: typeof import("../src/components/pages/education/ProgramList/ProgramList.vue")['default']
export const StudyModal: typeof import("../src/components/pages/education/StudyModal/StudyModal.vue")['default']
export const EventCard: typeof import("../src/components/pages/events/EventCard/EventCard.vue")['default']
export const EventChoices: typeof import("../src/components/pages/events/EventChoices/EventChoices.vue")['default']
export const EventModal: typeof import("../src/components/pages/events/EventModal/EventModal.vue")['default']
export const EventResult: typeof import("../src/components/pages/events/EventResult/EventResult.vue")['default']
export const BalancePanel: typeof import("../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']
export const ExpenseList: typeof import("../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']
export const FinanceActionList: typeof import("../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']
export const SkillCard: typeof import("../src/components/pages/skills/SkillCard/SkillCard.vue")['default']
export const SkillList: typeof import("../src/components/pages/skills/SkillList/SkillList.vue")['default']
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
export const LazyGameNav: LazyComponent<typeof import("../src/components/global/GameNav/GameNav.vue")['default']>
export const LazyActionCard: LazyComponent<typeof import("../src/components/game/ActionCard/ActionCard.vue")['default']>
export const LazyActionCardList: LazyComponent<typeof import("../src/components/game/ActionCardList/ActionCardList.vue")['default']>
export const LazyActionTabs: LazyComponent<typeof import("../src/components/game/ActionTabs/ActionTabs.vue")['default']>
export const LazyEmptyState: LazyComponent<typeof import("../src/components/game/EmptyState/EmptyState.vue")['default']>
export const LazyIndustryFilter: LazyComponent<typeof import("../src/components/game/IndustryFilter/IndustryFilter.vue")['default']>
export const LazyNewbornWelcomeScreen: LazyComponent<typeof import("../src/components/game/NewbornWelcomeScreen/index.vue")['default']>
export const LazySectionHeader: LazyComponent<typeof import("../src/components/game/SectionHeader/SectionHeader.vue")['default']>
export const LazyStatBar: LazyComponent<typeof import("../src/components/game/StatBar.vue")['default']>
export const LazyWorkTabs: LazyComponent<typeof import("../src/components/game/WorkTabs/WorkTabs.vue")['default']>
export const LazyGameButton: LazyComponent<typeof import("../src/components/ui/GameButton/index.vue")['default']>
export const LazyGameModalHost: LazyComponent<typeof import("../src/components/ui/GameModalHost/GameModalHost.vue")['default']>
export const LazyModal: LazyComponent<typeof import("../src/components/ui/Modal/index.vue")['default']>
export const LazyModalConstants: LazyComponent<typeof import("../src/components/ui/Modal/modal.constants")['default']>
export const LazyModalStackHost: LazyComponent<typeof import("../src/components/ui/ModalStackHost/ModalStackHost.vue")['default']>
export const LazyProgressBar: LazyComponent<typeof import("../src/components/ui/ProgressBar/index.vue")['default']>
export const LazyRoundedPanel: LazyComponent<typeof import("../src/components/ui/RoundedPanel/index.vue")['default']>
export const LazyStatChange: LazyComponent<typeof import("../src/components/ui/StatChange/StatChange.vue")['default']>
export const LazyIndexConstants: LazyComponent<typeof import("../src/components/ui/Toast/index.constants")['default']>
export const LazyToast: LazyComponent<typeof import("../src/components/ui/Toast/index.vue")['default']>
export const LazyTooltip: LazyComponent<typeof import("../src/components/ui/Tooltip/index.vue")['default']>
export const LazyGameLayout: LazyComponent<typeof import("../src/components/layout/GameLayout/GameLayout.vue")['default']>
export const LazyActivityFilter: LazyComponent<typeof import("../src/components/pages/activity/ActivityFilter/ActivityFilter.vue")['default']>
export const LazyActivityLogList: LazyComponent<typeof import("../src/components/pages/activity/ActivityLogList/ActivityLogList.vue")['default']>
export const LazyCareerTrack: LazyComponent<typeof import("../src/components/pages/career/CareerTrack/CareerTrack.vue")['default']>
export const LazyCurrentJobPanel: LazyComponent<typeof import("../src/components/pages/career/CurrentJobPanel/CurrentJobPanel.vue")['default']>
export const LazyWorkShiftPanel: LazyComponent<typeof import("../src/components/pages/career/WorkShiftPanel/WorkShiftPanel.vue")['default']>
export const LazyActivityLogCard: LazyComponent<typeof import("../src/components/pages/dashboard/ActivityLogCard/ActivityLogCard.vue")['default']>
export const LazyHomePreview: LazyComponent<typeof import("../src/components/pages/dashboard/HomePreview/HomePreview.vue")['default']>
export const LazyProfileCard: LazyComponent<typeof import("../src/components/pages/dashboard/ProfileCard/ProfileCard.vue")['default']>
export const LazySkillsModal: LazyComponent<typeof import("../src/components/pages/dashboard/SkillsModal/SkillsModal.vue")['default']>
export const LazyStatsCard: LazyComponent<typeof import("../src/components/pages/dashboard/StatsCard/StatsCard.vue")['default']>
export const LazyWorkButtonTypes: LazyComponent<typeof import("../src/components/pages/dashboard/WorkButton/WorkButton.types")['default']>
export const LazyWorkButton: LazyComponent<typeof import("../src/components/pages/dashboard/WorkButton/WorkButton.vue")['default']>
export const LazyWorkChoiceModal: LazyComponent<typeof import("../src/components/pages/dashboard/WorkChoiceModal/WorkChoiceModal.vue")['default']>
export const LazyWorkResultModal: LazyComponent<typeof import("../src/components/pages/dashboard/WorkResultModal/WorkResultModal.vue")['default']>
export const LazyEducationLevel: LazyComponent<typeof import("../src/components/pages/education/EducationLevel/EducationLevel.vue")['default']>
export const LazyProgramList: LazyComponent<typeof import("../src/components/pages/education/ProgramList/ProgramList.vue")['default']>
export const LazyStudyModal: LazyComponent<typeof import("../src/components/pages/education/StudyModal/StudyModal.vue")['default']>
export const LazyEventCard: LazyComponent<typeof import("../src/components/pages/events/EventCard/EventCard.vue")['default']>
export const LazyEventChoices: LazyComponent<typeof import("../src/components/pages/events/EventChoices/EventChoices.vue")['default']>
export const LazyEventModal: LazyComponent<typeof import("../src/components/pages/events/EventModal/EventModal.vue")['default']>
export const LazyEventResult: LazyComponent<typeof import("../src/components/pages/events/EventResult/EventResult.vue")['default']>
export const LazyBalancePanel: LazyComponent<typeof import("../src/components/pages/finance/BalancePanel/BalancePanel.vue")['default']>
export const LazyExpenseList: LazyComponent<typeof import("../src/components/pages/finance/ExpenseList/ExpenseList.vue")['default']>
export const LazyFinanceActionList: LazyComponent<typeof import("../src/components/pages/finance/FinanceActionList/FinanceActionList.vue")['default']>
export const LazySkillCard: LazyComponent<typeof import("../src/components/pages/skills/SkillCard/SkillCard.vue")['default']>
export const LazySkillList: LazyComponent<typeof import("../src/components/pages/skills/SkillList/SkillList.vue")['default']>
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
