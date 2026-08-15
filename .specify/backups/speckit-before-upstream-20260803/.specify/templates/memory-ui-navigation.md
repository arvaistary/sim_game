# Navigation Map (durable UI memory)

<!--
  The durable graph of transitions between the project's screens. Updated by
  /speckit.finalize (the UI memory sync step) from §"Route & Context" and
  §"Interactions & Navigation" of the work-item's ui-plan.md. Edges and guards
  outlive the feature; concrete gestures (IX-###) stay in the snapshot.
-->

## Guards and redirects

| Route | Guard | Where it sends on denial |
|-------|-------|--------------------------|
| … | requires auth | → … |

## Transition edges

<!-- Format: SCREEN-source → SCREEN-target (or route) : reason for the transition -->

- SCREEN-… → SCREEN-… : …

## Graph (Mermaid, optional)

```mermaid
flowchart LR
  %% SCREEN-login --> SCREEN-feed
```
