# Recurring negative patterns

Record a pattern after at least two related findings, or one severe finding that clearly exposes a systemic gap. Link every pattern to finding IDs.

## Pattern template

```text
### PAT-001 — <pattern name>

- Evidence: <AUD-...>, <AUD-...>
- First seen: <date>
- Last seen: <date>
- Affected areas: <areas>
- Failure mode: <what repeats>
- Prevention: <test, checklist item, or rule>
- Proposed rule update: <file and change, or None>
- Status: Observed | Rule proposed | Rule adopted | Retired
```

## Patterns

### PAT-20260827-001 — Host workflow artifacts are not isolated

- Evidence: AUD-20260827-001, AUD-20260827-006
- First seen: 2026-08-27
- Last seen: 2026-08-27
- Affected areas: agent entrypoints and workflow discovery
- Failure mode: tool-specific rules, skills, or state are discoverable from another host
- Prevention: explicit host entrypoints, portable core/adapters, and no cross-host state by default
- Proposed rule update: `AGENTS.md` and `agent-workflow/layers/host-codex.md` — already implemented
- Status: Rule adopted
