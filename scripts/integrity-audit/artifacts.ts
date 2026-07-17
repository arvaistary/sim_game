import type { AuditArtifacts, AuditMatrixEntry, Baseline, Finding, GateRun, RegressionCheck } from './integrity-audit.types'

const terminalFindingStates: Set<string> = new Set(['verified', 'rejected'])
const openFindingStates: Set<string> = new Set(['open', 'confirmed', 'fixing', 'fixed', 'blocked'])
const requiredViewports: string[] = ['390x844', '768x1024', '1440x900']
const requiredGates: string[] = ['typecheck', 'eslint', 'stylelint', 'rules-audit', 'vitest', 'build']

/**
 * @description Validate persisted integrity audit artifacts against closure invariants.
 * @return { string[] } Validation errors.
 */
export function validateArtifacts(input: Partial<AuditArtifacts>): string[] {
  const errors: string[] = []
  const baseline: Baseline | undefined = input.baseline
  const matrix: AuditMatrixEntry[] = input.matrix ?? []
  const findings: Finding[] = input.findings ?? []
  const regressions: RegressionCheck[] = input.regressions ?? []
  const gates: GateRun[] = input.gates ?? []

  if (!baseline?.repositoryRevision) errors.push('baseline.repositoryRevision is required')

  if (baseline && Object.keys(baseline.environment).length === 0) errors.push('baseline.environment is required')

  for (const row of matrix) {

    if (row.result === 'fail' && row.findingIds.length === 0) errors.push(`${row.id} failed row has no finding`)

    if (row.result === 'pass' && row.evidence.length === 0) errors.push(`${row.id} passing row has no evidence`)

    if (row.result === 'blocked' && baseline?.status === 'complete') errors.push(`${row.id} blocked row cannot remain at closure`)
  }

  for (const finding of findings) {

    if (!/^F-\d{3}$/.test(finding.id)) errors.push(`${finding.id} invalid finding id`)

    if (finding.evidence.length === 0) errors.push(`${finding.id} evidence is required`)

    if (finding.reproduction.length === 0) errors.push(`${finding.id} reproduction is required`)

    if (['confirmed', 'fixing', 'fixed', 'verified'].includes(finding.status) && !finding.recommendation) errors.push(`${finding.id} recommendation is required`)

    if (['fixing', 'fixed', 'verified'].includes(finding.status) && !finding.rootCause) errors.push(`${finding.id} rootCause is required before ${finding.status}`)

    if (finding.status === 'fixed' && !finding.regressionCheckId) errors.push(`${finding.id} regressionCheckId is required before fixed`)

    if (finding.status === 'verified' && !finding.regressionCheckId) errors.push(`${finding.id} verified finding has no regression check`)

    if (baseline?.status === 'complete' && !terminalFindingStates.has(finding.status)) errors.push(`${finding.id} is not terminal at closure`)
  }

  for (const regression of regressions) {

    if (!/^RC-\d{3}$/.test(regression.id)) errors.push(`${regression.id} invalid regression id`)

    if (regression.result === 'pass' && !regression.evidence) errors.push(`${regression.id} passing regression has no evidence`)
  }

  const findingIds: Set<string> = new Set(findings.map(finding => finding.id))

  for (const row of matrix) for (const id of row.findingIds) if (!findingIds.has(id)) errors.push(`${row.id} references missing finding ${id}`)

  for (const finding of findings) {
    if (finding.regressionCheckId && !regressions.some(regression => regression.id === finding.regressionCheckId && regression.findingId === finding.id && regression.result === 'pass')) {
      errors.push(`${finding.id} has no passing linked regression check`)
    }
  }

  if (baseline?.status === 'complete') {
    for (const route of baseline.inventories.routes) for (const viewport of requiredViewports) {

      const row: AuditMatrixEntry | undefined = matrix.find(entry => entry.kind === 'route' && entry.subject === route && entry.viewport === viewport)

      if (!row || row.result !== 'pass') errors.push(`route ${route} missing passing ${viewport} coverage`)
    }

    for (const gate of requiredGates) if (!gates.some(run => run.gate === gate && run.result === 'pass')) errors.push(`mandatory gate ${gate} has no passing run`)

    if (findings.some(finding => openFindingStates.has(finding.status))) errors.push('open or blocked findings remain at closure')
  }

  return errors
}

/**
 * @description Throw when integrity audit artifacts violate closure invariants.
 * @return { void } No value.
 */
export function assertValidArtifacts(input: Partial<AuditArtifacts>): void {
  const errors: string[] = validateArtifacts(input)

  if (errors.length > 0) throw new Error(errors.join('\n'))
}
