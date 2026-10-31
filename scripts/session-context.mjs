// SessionStart hook: puts the routing table in front of the main session so it
// delegates to the right agent instead of doing cheap work on the big model.

const context = `model-router is active. Delegate by task shape so cheap work does not run on the main model:
- model-router:scout (haiku): finding files, searching code, reading logs or docs, summarising. Read-only.
- model-router:implementer (sonnet): a well-specified change with known files and a clear done condition, plus running the tests.
- model-router:reviewer (opus): reviewing a diff, security questions, design trade-offs. Read-only.
Keep planning, ambiguous debugging and anything needing the whole conversation on the main thread.
Brief every agent with the handoff shape: Goal, Known (files, facts already established), Ruled out, Done when, Report format.
Untyped general-purpose calls are routed by keyword rules; set model explicitly to override.`

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context }
}))
