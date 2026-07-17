import { describe, expect, it } from 'vitest'
import { validateArtifacts } from '../../../scripts/integrity-audit/artifacts'
import type { Finding, RegressionCheck } from '../../../scripts/integrity-audit/integrity-audit.types'

describe('integrity regression manifest', () => {
  it('requires every verified finding to link one passing check', () => {
    const finding: Finding = { id: 'F-001', title: 'verified', severity: 'P2', status: 'verified', expectedSource: 'spec', evidence: ['evidence'], reproduction: ['step'], expected: 'pass', actual: 'fail', recommendation: 'fix', affectedLayer: 'tooling', affectedModes: ['spa'], rootCause: 'cause', regressionCheckId: 'RC-001' }
    const check: RegressionCheck = { id: 'RC-001', findingId: 'F-001', type: 'unit', command: 'npm test', assertions: ['pass'], result: 'fail', evidence: 'failed' }
    expect(validateArtifacts({ findings: [finding], regressions: [check] })).toContain('F-001 has no passing linked regression check')
  })
})
