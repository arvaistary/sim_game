export interface ActionsFeatureFlags {
  schemaV2: boolean
  engineReasonsV2: boolean
  financeUnifiedV2: boolean
  eventIngressIntegration: boolean
  needsValidation: boolean
  antiGrind: boolean
}

export interface FeatureFlagStatusEntry {
  key: keyof ActionsFeatureFlags
  enabled: boolean
  description: string
}
