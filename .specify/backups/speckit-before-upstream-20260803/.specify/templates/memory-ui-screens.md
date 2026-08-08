# Screen Registry (durable UI memory)

<!--
  The durable picture of the project's screens. Updated ONLY by /speckit.finalize
  (the UI memory sync step) from the completed work-item's `ui-plan.md` — NOT by hand
  during a feature. The snapshot of "what exactly the feature does to a screen"
  (ST/IX, test matrix, design references) lives in specs/NNN/ui-plan.md and is NOT
  copied here.

  finalize:
    NEW screen     → new row; ID = SCREEN-<slug> (slug from the name/route,
                     e.g. /feed → SCREEN-feed); last-touched = work-item.
    CHANGED screen → update route/archetype/controller if they changed;
                     bump last-touched.

  A CHANGED screen in a ui-plan references the SCREEN-<slug> FROM THIS table.
  Default approach is pointer-style (i): the full state model of a screen = read the
  latest + prior ui-plans via the "Touched (work-items)" column. For screens hit by
  3+ features, optionally (ii): create a living ui/screens/<slug>.md and merge into it.
-->

| SCREEN-ID | Screen name | Route | Archetype | Controller | Touched (work-items) |
|-----------|-------------|-------|-----------|------------|----------------------|
| SCREEN-… | … | … | collection/detail/form/gate/shell/composite | … | NNN-… |
