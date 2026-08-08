# Game Life Constitution

## Core Principles

### I. Layered Architecture (NON-NEGOTIABLE)

The project strictly follows a layered architecture with unidirectional dependency flow:

```
utils/constants → domain → application → infrastructure → stores/composables → components → pages
```

- Each layer has clear responsibilities and can only import from layers below it
- Domain layer contains ONLY business logic and game balance - no UI, no infrastructure
- Application layer coordinates use cases without business logic
- Infrastructure handles external concerns (persistence, APIs)
- Presentation layer (stores, composables, components, pages) handles UI and user interaction
- Import violations between layers are critical failures

### II. Type Safety (NON-NEGOTIABLE)

TypeScript strict mode is mandatory for all code:

- All variables must have explicit type annotations (no reliance on type inference)
- Types must be in separate `*.types.ts` files, not inline
- No `any` type allowed - use `unknown` with type guards or explicit domain types
- All function parameters and return values must be explicitly typed
- Module boundaries require explicit type exports

### III. Code Style & Quality

All code must follow the project's coding standards defined in `.cursor/rules/`:

- Naming conventions: boolean prefixes, action verbs for functions, `Ui*` for UI components
- Vue SFC structure follows strict ordering (imports → props → emits → routing → stores → state → computed → handlers → lifecycle)
- Styles in separate `.scss` files, no `<style>` blocks in `.vue` files
- TSDoc comments for all exported functions
- Grouped imports with separators between groups
- meaningful variable and function names (no single-letter variables in callbacks)

### IV. Separation of Concerns

Each layer and module has a single, well-defined responsibility:

- **Domain:** Game balance, business rules, no external dependencies
- **Application:** Use cases, coordination, no business logic
- **Infrastructure:** External systems, persistence, no business rules
- **Presentation:** UI and user interaction, no business logic
- Game balance data lives in `src/domain/balance/constants/`
- UI components are in `src/components/` with appropriate prefixes

### V. Testing

Tests are written to verify behavior, not implementation:

- Unit tests for domain logic and business rules
- Component tests for UI behavior
- Integration tests for critical workflows
- Tests must be maintainable and focused
- New features require tests before implementation

## Development Workflow

### Before Writing Code

1. Review existing architecture and patterns
2. Check if similar functionality already exists
3. Follow the layered architecture for the feature's placement
4. Consider impact on existing code and documentation

### During Development

1. Follow all coding standards and rules
2. Maintain type safety throughout
3. Keep functions and components focused and small
4. Write tests for new functionality
5. Update relevant documentation

### After Development

1. Run `npm run typecheck` - must pass
2. Run `npm run rules:audit` - must pass or have justified exceptions
3. Run tests - must pass
4. Update documentation (IMPLEMENTATION_STATUS.md, ADRs if needed)
5. Review import dependencies for layer violations

## Quality Gates

### Type Safety
- `npm run typecheck` must pass with zero errors
- No `any` types allowed
- All types must be explicitly defined

### Code Style
- `npm run rules:audit` must pass
- Code must follow `.cursor/rules/` standards
- ESLint and Stylelint must pass

### Testing
- All tests must pass
- New features require tests
- Critical paths require integration tests

### Documentation
- IMPLEMENTATION_STATUS.md must be updated
- Architecture changes require ADRs
- New features require documentation updates

## Non-Negotiable Requirements

1. **Layered Architecture:** Never violate import direction rules
2. **Type Safety:** No any types, explicit typing everywhere
3. **Code Style:** Follow all rules in `.cursor/rules/`
4. **Separation:** Keep business logic out of presentation
5. **Testing:** Test behavior, not implementation
6. **Documentation:** Keep docs in sync with code

## Governance

### Constitution Authority

This constitution supersedes all other development practices. All PRs must verify compliance with these principles before merge.

### Amendments

Amendments require:
- Documentation of the change
- Team approval
- Migration plan for existing code
- Update to this document

### Complexity Justification

Complex code must be justified by:
- Clear business requirements
- No simpler alternative
- Comprehensive documentation
- Thorough test coverage

### Runtime Guidance

For day-to-day development guidance, refer to:
- `.cursor/rules/` - Code style and architecture rules
- `doc/core/ARCHITECTURE_OVERVIEW.md` - Detailed architecture documentation
- `doc/core/IMPLEMENTATION_STATUS.md` - Module implementation status
- `doc/adr/` - Architecture Decision Records

## Version History

**Version:** 1.0.0
**Ratified:** 2026-06-02
**Last Amended:** 2026-06-02
**Amendments:** None