# Handoff brief

Agents of different models share context through the brief going in and the
report coming out, not through a shared transcript. A subagent starts with an
empty context (on its own prompt cache), so the brief is the only thing it
knows. Keep it short and complete.

```
Goal: <one sentence, the outcome, not the steps>
Known: <files, facts and decisions already established; paths, not pastes>
Ruled out: <what was already tried or checked, so it is not redone>
Done when: <the observable condition that ends the task>
Report: <the agent's report format, already in its definition; add extra fields here>
```

The report formats in `agents/*.md` are fixed so the main session can read
any agent's result the same way.
