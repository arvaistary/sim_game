import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateArtifacts } from './artifacts.ts'
import type { AuditMatrixEntry, Baseline, Finding, GateRun, RegressionCheck } from './integrity-audit.types.ts'

const target = process.argv[2] ?? 'specs/003-project-integrity-audit'
const required = ['baseline.md', 'audit-matrix.md', 'findings.md', 'gate-runs.md', 'closure-report.md']
const read = async (file: string): Promise<string> => readFile(join(target, file), 'utf8').catch(() => '')
const documents = Object.fromEntries(await Promise.all(required.map(async file => [file, await read(file)]))) as Record<string, string>
const errors: string[] = []
for (const file of required) if (!documents[file]) errors.push(`missing required artifact ${file}`)

const baselineText = documents['baseline.md']
const revision = baselineText.match(/Repository revision:\s*`([^`]+)`/)?.[1] ?? ''
const status = baselineText.match(/Status:\s*`([^`]+)`/)?.[1] ?? 'invalid'
const list = (label: string): string[] => {
  const value = baselineText.match(new RegExp(`${label}:\\s*([^\\n]+)`))?.[1] ?? ''
  return [...value.matchAll(/`([^`]+)`/g)].map(match => match[1])
}
const baseline: Baseline = {
  id: baselineText.match(/ID:\s*`([^`]+)`/)?.[1] ?? 'AUD-00000000-00', capturedAt: new Date().toISOString(), repositoryRevision: revision,
  dirtyPaths: [], environment: { source: 'baseline.md' }, inventories: { routes: list('Routes'), endpoints: list('Nitro endpoint inventory'), layers: list('Layer inventory'), scenarios: list('Scenario inventory'), tests: [] }, gateRuns: [], status: status === 'complete' ? 'complete' : 'invalid',
}

const rows: AuditMatrixEntry[] = documents['audit-matrix.md'].split(/\r?\n/).filter(line => /^\| [A-Z]-\d+/.test(line)).map(line => {
  const values = line.split('|').slice(1, -1).map(value => value.trim())
  return { id: values[0], kind: values[1] as AuditMatrixEntry['kind'], subject: values[2], mode: values[3] as AuditMatrixEntry['mode'], viewport: values[4] as AuditMatrixEntry['viewport'], expectedSource: values[5], result: values[6] as AuditMatrixEntry['result'], evidence: values[7] === '—' ? [] : [values[7]], findingIds: values[8] === '—' ? [] : values[8].split(',').map(value => value.trim()) }
})

const findings: Finding[] = [...documents['findings.md'].matchAll(/^## (F-\d{3}):/gm)].map(match => {
  const section = documents['findings.md'].slice(match.index ?? 0, documents['findings.md'].indexOf('\n## ', (match.index ?? 0) + 4) < 0 ? undefined : documents['findings.md'].indexOf('\n## ', (match.index ?? 0) + 4))
  const value = (label: string): string => section.match(new RegExp(`- ${label}:\\s*([^\\n]+)`))?.[1].trim() ?? ''
  const regressionCheckId = value('Regression check').replaceAll('`', '')
  return { id: match[1], title: match[0], severity: value('Severity') as Finding['severity'], status: value('Status') as Finding['status'], expectedSource: value('Expected source'), evidence: [value('Evidence')], reproduction: [value('Reproduction')], expected: value('Expected'), actual: value('Actual'), recommendation: value('Recommendation'), affectedLayer: value('Affected layer'), affectedModes: ['spa'], rootCause: value('Root cause'), regressionCheckId: regressionCheckId || undefined }
})

const regressions: RegressionCheck[] = findings.flatMap(finding => {
  if (!finding.regressionCheckId) return []
  const sectionStart = documents['findings.md'].indexOf(`## ${finding.id}:`)
  const sectionEnd = documents['findings.md'].indexOf('\n## ', sectionStart + 4)
  const section = documents['findings.md'].slice(sectionStart, sectionEnd < 0 ? undefined : sectionEnd)
  const value = (label: string): string => section.match(new RegExp(`- ${label}:\\s*([^\\n]+)`))?.[1].trim() ?? ''
  return [{ id: finding.regressionCheckId, findingId: finding.id, type: 'manual', command: value('Regression command').replaceAll('`', ''), assertions: [value('Regression assertion')], result: value('Regression result').replaceAll('`', '') as RegressionCheck['result'], evidence: value('Regression evidence') }]
})

const gates: GateRun[] = documents['gate-runs.md'].split(/\r?\n/).filter(line => /^\| GR-\d+/.test(line)).map(line => {
  const values = line.split('|').slice(1, -1).map(value => value.trim())
  return { id: values[0], gate: values[1] as GateRun['gate'], command: values[2].replaceAll('`', ''), startedAt: '', completedAt: '', exitCode: Number(values[3]), result: values[4] as GateRun['result'], evidence: values[5], relatedFindingIds: values[6] === '—' ? [] : [values[6]] }
})

errors.push(...validateArtifacts({ baseline, matrix: rows, findings, regressions, gates }))
if (errors.length > 0) { console.error(errors.join('\n')); process.exitCode = 1 } else console.log(`integrity audit artifacts valid: ${required.length} documents, ${rows.length} matrix rows, ${findings.length} findings, ${gates.length} gates`)
