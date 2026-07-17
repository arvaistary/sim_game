import { describe, expect, it } from 'vitest'
import { validateArtifacts } from '../../../scripts/integrity-audit/artifacts'

describe('integrity closure invariants', () => {
  it('rejects open findings at closure', () => {
    const errors = validateArtifacts({ baseline: { id: 'AUD-20260716-01', capturedAt: 'now', repositoryRevision: 'sha', dirtyPaths: [], environment: { node: '24' }, inventories: { routes: [], endpoints: [], layers: [], scenarios: [], tests: [] }, gateRuns: [], status: 'complete' }, findings: [{ id: 'F-001', title: 'open', severity: 'P2', status: 'open', expectedSource: 'spec', evidence: ['evidence'], reproduction: ['step'], expected: 'pass', actual: 'fail', recommendation: 'fix', affectedLayer: 'tooling', affectedModes: ['spa'] }] })
    expect(errors).toContain('F-001 is not terminal at closure')
    expect(errors).toContain('open or blocked findings remain at closure')
  })
})
