# ADR-0008: Accent + Glass material contract

## Status

Accepted

## Context

UI surfaces used opaque card colors and local blur/gradient overrides. That made the selected accent palette invisible in the application atmosphere and caused light/dark shell surfaces to diverge.

## Decision

Introduce one semantic material contract in global CSS variables and SCSS mixins:

- `chrome` for persistent navigation;
- `panel` for cards, sections and overlays;
- `inset` for nested controls;
- `solid` for primary/destructive controls.

Accent tokens drive ambient gradients, borders and focus/selection edges. Every glass surface keeps an opaque semantic fallback for browsers without `backdrop-filter`; reduced-transparency users receive opaque surfaces and no blur.

`RoundedPanel` exposes the material variants so callers can opt into a surface without adding wrapper components or local business logic.

Repeated cards may opt into `glass-surface(panel, false)`: they keep the semantic panel fill, border and shadow without creating a separate backdrop blur layer. Large shell, overlay and feature surfaces retain the blurred material.

## Consequences

Palette changes now affect both controls and canvas atmosphere. Shared shell and overlay surfaces have consistent light/dark behavior. Remaining feature-local status colors stay semantic and are migrated independently from the material primitives.
