/** Semantic locator policy for audit suites; product selector changes need finding-specific tasks. */
export const integritySelectors = {
  main: 'main',
  navigation: 'nav',
  modal: '[role="dialog"]',
  primaryAction: 'button:not([disabled])',
} as const
