import { describe, expect, it } from 'vitest'
import { validateArtifacts } from '../../../scripts/integrity-audit/artifacts'
import type { AuditArtifacts, AuditMatrixEntry, Baseline, Finding, RegressionCheck } from '../../../scripts/integrity-audit/integrity-audit.types'

const baseline: Baseline = {
  id: 'AUD-20260716-01', capturedAt: '2026-07-16T00:00:00.000Z', repositoryRevision: 'abc123', dirtyPaths: [],
  environment: { node: '25' }, inventories: { routes: ['/'], endpoints: [], layers: [], scenarios: [], tests: [] }, gateRuns: [], status: 'capturing',
}

const row: AuditMatrixEntry = { id: 'M-001', kind: 'architecture', subject: 'domain', mode: 'not-applicable', viewport: 'not-applicable', expectedSource: 'spec.md', evidence: ['test'], result: 'pass', findingIds: [] }
const finding: Finding = { id: 'F-001', title: 'Example', severity: 'P2', status: 'verified', expectedSource: 'spec.md', evidence: ['test output'], reproduction: ['run test'], expected: 'pass', actual: 'fail', recommendation: 'change code', affectedLayer: 'tooling', affectedModes: ['spa'], rootCause: 'regression', regressionCheckId: 'RC-001' }
const regression: RegressionCheck = { id: 'RC-001', findingId: 'F-001', type: 'unit', command: 'npm test', assertions: ['observable result'], result: 'pass', evidence: 'passed' }

describe('integrity audit artifact contracts', () => {
  it('accepts a valid non-closure artifact set', () => {
    expect(validateArtifacts({ baseline, matrix: [row], findings: [finding], regressions: [regression], gates: [] })).toEqual([])
  })

  it('rejects invalid finding IDs and missing evidence', () => {
    const invalid: Finding = { ...finding, id: 'F-1', evidence: [] }
    expect(validateArtifacts({ baseline, findings: [invalid] }).join('\n')).toMatch(/invalid finding id|evidence is required/)
  })

  it('rejects failed rows without findings', () => {
    expect(validateArtifacts({ baseline, matrix: [{ ...row, result: 'fail', evidence: [] }] })).toContain('M-001 failed row has no finding')
  })

  it('rejects illegal closure states and missing linked regression checks', () => {
    const closure: AuditArtifacts = {
      baseline: { ...baseline, status: 'complete' }, matrix: [], findings: [{ ...finding, regressionCheckId: undefined }], regressions: [], gates: [],
    }
    const errors = validateArtifacts(closure)
    expect(errors).toContain('F-001 verified finding has no regression check')
    expect(errors).toContain('mandatory gate typecheck has no passing run')
  })
})
