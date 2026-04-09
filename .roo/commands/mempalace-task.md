---
description: "Краткое описание того, что делает эта команда"
---

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