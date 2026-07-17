export type AuditResult = 'not-run' | 'pass' | 'fail' | 'blocked'
export type GateKind = 'typecheck' | 'eslint' | 'stylelint' | 'rules-audit' | 'vitest' | 'browser' | 'build'
export type FindingSeverity = 'P0' | 'P1' | 'P2' | 'P3'
export type FindingStatus = 'open' | 'confirmed' | 'fixing' | 'fixed' | 'verified' | 'rejected' | 'blocked'
export type MatrixKind = 'route' | 'scenario' | 'architecture' | 'api' | 'quality-gate' | 'documentation'
export type ExecutionMode = 'spa' | 'server' | 'hybrid' | 'all' | 'not-applicable'
export type Viewport = '390x844' | '768x1024' | '1440x900' | 'not-applicable'

export interface GateRun {
  id: string
  gate: GateKind
  command: string
  startedAt: string
  completedAt: string
  exitCode: number
  result: 'pass' | 'fail' | 'blocked'
  evidence: string
  relatedFindingIds: string[]
}

export interface Inventory {
  routes: string[]
  endpoints: string[]
  layers: string[]
  scenarios: string[]
  tests: string[]
}

export interface Baseline {
  id: string
  capturedAt: string
  repositoryRevision: string
  dirtyPaths: string[]
  environment: Record<string, string>
  inventories: Inventory
  gateRuns: string[]
  status: 'capturing' | 'complete' | 'invalid'
}

export interface AuditMatrixEntry {
  id: string
  kind: MatrixKind
  subject: string
  mode: ExecutionMode
  viewport: Viewport
  expectedSource: string
  evidence: string[]
  result: AuditResult
  findingIds: string[]
}

export interface Finding {
  id: string
  title: string
  severity: FindingSeverity
  status: FindingStatus
  expectedSource: string
  evidence: string[]
  reproduction: string[]
  expected: string
  actual: string
  recommendation: string
  affectedLayer: string
  affectedModes: Array<Exclude<ExecutionMode, 'all' | 'not-applicable'>>
  rootCause?: string
  fixReferences?: string[]
  regressionCheckId?: string
}

export interface RegressionCheck {
  id: string
  findingId: string
  type: 'unit' | 'integration' | 'browser' | 'architecture' | 'manual'
  command: string
  assertions: string[]
  result: AuditResult
  evidence: string
}

export interface AuditArtifacts {
  baseline: Baseline
  matrix: AuditMatrixEntry[]
  findings: Finding[]
  regressions: RegressionCheck[]
  gates: GateRun[]
}
