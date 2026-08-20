# Architecture Decision Records (ADRs)

## Purpose

Architecture Decision Records (ADRs) document significant architectural decisions in the Game Life project. Each ADR captures:

- The context and problem
- Considered alternatives
- The decision made
- Consequences of the decision

## ADR Format

Each ADR follows this structure:

```markdown
# ADR-[number]: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[What is the issue that we're seeing that is motivating this decision or change?]

## Decision
[What is the change that we're proposing and/or doing?]

## Consequences
- [What becomes easier or more difficult to do because of this change?]
- [What are the trade-offs of this decision?]

## Alternatives Considered
- [What other approaches did we consider?]
- [Why did we reject them?]
```

## Existing ADRs

Located in `doc/adr/`:

1. **ADR-0002:** ECS Removal
   - Status: Accepted
   - Decision: Remove ECS architecture in favor of layered architecture
   - Consequence: Simpler codebase, better TypeScript support, easier testing

2. **ADR-0003:** Layered Architecture
   - Status: Accepted
   - Decision: Adopt strict layered architecture with dependency flow
   - Consequence: Clear separation of concerns, maintainable codebase

3. **ADR-0006:** Durable Game-State Persistence
   - Status: Accepted
   - Decision: Use PostgreSQL as canonical M3 snapshot storage with application-owned idempotency, compare-and-swap and unit-of-work boundaries; defer Redis and persistent identity
   - Consequence: State survives process replacement; hosted provisioning and migration rehearsal remain deployment gates

## Decision Categories

### Framework & Technology
- Framework and stack decisions
- Library selection decisions
- Build tool configuration

### Architecture Patterns
- Layered architecture adoption
- ECS removal
- Command/Query pattern adoption

### Data Management
- LocalStorage persistence
- State management approach (Pinia)
- Data flow patterns

### UI/UX
- Component organization
- Styling approach (SCSS)
- Modal system design

## ADR Lifecycle

1. **Proposed:** Drafted for discussion
2. **Accepted:** Implemented and deployed
3. **Deprecated:** Still in use but should be removed
4. **Superseded:** Replaced by a newer ADR

## When to Create an ADR

Create an ADR when:

- Adding a new major technology or framework
- Changing the overall architecture pattern
- Making a decision that affects multiple modules
- Choosing between significant alternatives
- Establishing new patterns or conventions

Do NOT create an ADR for:

- Bug fixes
- Routine refactoring within existing patterns
- Small feature additions
- Configuration changes
- Minor optimizations

## ADR Review Process

1. **Draft:** Create ADR with "Proposed" status
2. **Discuss:** Team reviews and provides feedback
3. **Revise:** Update ADR based on feedback
4. **Accept:** Change status to "Accepted"
5. **Implement:** Apply the decision to the codebase
6. **Reference:** Link to ADR in relevant code comments

## ADR Repository Structure

```
doc/adr/
├── README.md                    # This file
├── decision-guide.md            # Detailed guide for creating ADRs
├── 0002-ecs-removal.md
├── 0003-layered-architecture.md
├── architecture-research-report.md
└── nuxt4-architecture-analysis.md
```

## Reference in Code

When implementing an ADR decision, add a reference in the code:

```typescript
/**
 * Executes a lifestyle action using the command pattern.
 *
 * Reference: ADR-0003 (Layered Architecture)
 * Reference: ADR-0005 (Command/Query Pattern)
 */
export function executeLifestyleAction(actionId: string): ActionResult {
  // ...
}
```

## Updating ADRs

When an ADR is superseded:

1. Update the status to "Superseded"
2. Add a reference to the new ADR
3. Document why it was superseded
4. Keep the old ADR for historical reference

When an ADR is deprecated:

1. Update the status to "Deprecated"
2. Document why it's being deprecated
3. Add a plan for removal
4. Keep the old ADR for historical reference

## ADR Quality Checklist

- [ ] Clear context and problem statement
- [ ] Well-considered alternatives
- [ ] Clear decision statement
- [ ] Thorough consequences analysis
- [ ] Proper categorization
- [ ] Consistent formatting
- [ ] Linked to related code changes
- [ ] Reviewed by team

## Related Documentation

- **Architecture Overview:** `architecture/overview.md`
- **Tech Stack:** `architecture/tech-stack.md`
- **Constitution:** `constitution.md`
- **Full ADRs:** `doc/adr/` (primary location)
