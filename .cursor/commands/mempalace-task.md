---
description: Start a task with MemPalace context and delegation brief
---

# MemPalace Task

Task description:
$ARGUMENTS

Use the local skill `mempalace-delegator` and execute this flow:

1. Refresh and inspect memory:
   - `npm run mem:mine`
   - `npm run mem:status`
   - `npm run mem:wakeup`
2. Generate focused MemPalace queries from task terms and search.
3. Build a concise task brief (goal, prior decisions, affected files, constraints, acceptance criteria).
4. Execute the task according to the brief.
5. Re-index memory with `npm run mem:mine`.

If task description is vague, ask up to 3 clarifying questions before implementation.
