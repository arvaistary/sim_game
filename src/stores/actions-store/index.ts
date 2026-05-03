
import type { ActionResult } from './index.types'

export const useActionsStore = defineStore('actions', () => {
  const lastExecutedAction = ref<string | null>(null)
  const actionResults = ref<ActionResult[]>([])

  function trackExecution(actionId: string, summary: string): void {
    lastExecutedAction.value = actionId
    actionResults.value.push({ success: true, summary })

    if (actionResults.value.length > 20) {
      actionResults.value = actionResults.value.slice(-20)
    }
  }

  const lastResult = computed<ActionResult | undefined>(() => actionResults.value[actionResults.value.length - 1])

  function reset(): void {
    lastExecutedAction.value = null
    actionResults.value = []
  }

  return {
    lastExecutedAction,
    actionResults,
    lastResult,
    trackExecution,
    reset,
  }
})

export type * from './index.types'
