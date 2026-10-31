import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'model-router-'))
const log = join(dir, 'route-log.jsonl')

function runHook(tool_input) {
  const out = execFileSync('node', ['scripts/route-agent.mjs'], {
    input: JSON.stringify({ session_id: 's1', hook_event_name: 'PreToolUse', tool_name: 'Agent', tool_input }),
    env: { ...process.env, MODEL_ROUTER_LOG: log }
  }).toString()
  return out ? JSON.parse(out) : null
}

test('routed call returns the full input with model set', () => {
  const input = { subagent_type: 'general-purpose', description: 'Find the router', prompt: 'look around' }
  const out = runHook(input).hookSpecificOutput
  assert.equal(out.hookEventName, 'PreToolUse')
  assert.equal(out.permissionDecision, 'allow')
  assert.deepEqual(out.updatedInput, { ...input, model: 'haiku' })
})

test('unrouted call prints nothing', () => {
  assert.equal(runHook({ subagent_type: 'Explore', description: 'Find the router', prompt: '' }), null)
})

test('every call is logged', () => {
  const rows = readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l))
  assert.equal(rows.length, 2)
  assert.equal(rows[0].model, 'haiku')
  assert.equal(rows[1].model, null)
})

test('session context hook emits additionalContext', () => {
  const out = JSON.parse(execFileSync('node', ['scripts/session-context.mjs']).toString())
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart')
  assert.match(out.hookSpecificOutput.additionalContext, /model-router:scout/)
})
