---
name: mempalace-task
description: # MemPalace Delegator

Use this skill when the user provides a new task description and wants the agent to gather project memory context from MemPalace before implementation.

## Trigger

- User asks to start a new task and wants context from MemPalace.
- User asks to delegate a task to an assistant with prior project decisions.
- Slash command `/mempalace-task` is invoked with task text.

## Inputs

- Task description in natural language.
- Optional constraints (files, deadlines, forbidden changes).

## Required workflow

1. Run:
   - `npm run mem:mine`
   - `npm run mem:status`
   - `npm run mem:wakeup`
2. Build 3-6 focused queries from the task (domain terms, scene names, systems, constraints).
3. Run MemPalace search for each query:
   - `.venv\Scripts\python -m mempalace.cli --palace ./.mempalace/palace search "<query>"`
4. Produce a concise execution brief with:
   - Objective
   - Relevant prior decisions from memory
   - Affected files/systems
   - Guardrails and non-goals
   - Validation plan
5. Proceed with implementation using this brief.
6. After implementation, run `npm run mem:mine` to persist the new context.

## Output format

- `Task Brief`
  - Goal
  - Context from MemPalace
  - Files to touch
  - Constraints
  - Acceptance criteria
- `Execution Plan` (short, actionable)

## Notes

- Prefer project-local memory over assumptions.
- If memory conflicts, call out the conflict and choose the most recent/explicit decision.
---

# Mempalace Task

## Instructions

Add your skill instructions here.
