// PreToolUse hook for the Agent tool. Reads the hook payload on stdin, picks a
// model with lib/router.mjs, and returns the full tool_input with `model` set.
// Every decision, including "left alone", is appended to the route log so the
// rules can be tuned from real traffic (see scripts/route-report.mjs).

import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { loadRules, route } from '../lib/router.mjs'

const payload = JSON.parse(await new Response(process.stdin).text())
const input = payload.tool_input ?? {}
const decision = route(input, loadRules())

const logPath = process.env.MODEL_ROUTER_LOG
  || join(process.env.CLAUDE_PLUGIN_DATA || process.cwd(), 'route-log.jsonl')
mkdirSync(dirname(logPath), { recursive: true })
appendFileSync(logPath, JSON.stringify({
  ts: new Date().toISOString(),
  session: payload.session_id,
  type: input.subagent_type ?? '',
  description: input.description ?? '',
  model: decision.model,
  rule: decision.rule,
  reason: decision.reason
}) + '\n')

if (decision.model) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      // updatedInput only takes effect with allow or ask; Agent calls do not
      // normally prompt, so allow changes nothing about permissions in practice.
      permissionDecision: 'allow',
      permissionDecisionReason: `model-router: ${decision.rule} -> ${decision.model}`,
      updatedInput: { ...input, model: decision.model }
    }
  }))
}
