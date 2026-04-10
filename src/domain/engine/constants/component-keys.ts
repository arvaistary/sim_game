export const LEGACY_TO_CANONICAL_KEY: Record<string, string> = {
  event_queue: 'eventQueue',
  event_history: 'eventHistory',
  lifetime_stats: 'lifetimeStats',
  activity_log: 'activityLog',
}

export const CANONICAL_TO_LEGACY_KEY: Record<string, string> = {
  eventQueue: 'event_queue',
  eventHistory: 'event_history',
  lifetimeStats: 'lifetime_stats',
  activityLog: 'activity_log',
}
