import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadRules, route } from '../lib/router.mjs'

const config = loadRules()
const gp = (description, prompt = '') => ({ subagent_type: 'general-purpose', description, prompt })

test('explicit model is never overridden', () => {
  assert.equal(route({ ...gp('find the config'), model: 'opus' }, config).model, null)
})

test('typed agents keep their own model', () => {
  assert.equal(route({ subagent_type: 'Explore', description: 'find the config' }, config).model, null)
  assert.equal(route({ subagent_type: 'model-router:scout', description: 'review auth' }, config).model, null)
})

test('missing subagent_type is routed like general-purpose', () => {
  assert.equal(route({ description: 'find the config file' }, config).model, 'haiku')
})

test('lookups go to haiku', () => {
  assert.equal(route(gp('Find API endpoints'), config).model, 'haiku')
  assert.equal(route(gp('Summarize the build logs'), config).model, 'haiku')
})

test('well-specified edits go to sonnet', () => {
  assert.equal(route(gp('Implement the CSV export'), config).model, 'sonnet')
  assert.equal(route(gp('Rename getUser to fetchUser'), config).model, 'sonnet')
})

test('hard work escalates to opus even when a cheap verb appears', () => {
  const d = route(gp('Find security holes in the auth flow'), config)
  assert.equal(d.model, 'opus')
  assert.equal(d.rule, 'escalate-hard')
})

test('prompt is scanned when the description says nothing', () => {
  assert.equal(route(gp('Auth module', 'Search the repo for every caller of login()'), config).model, 'haiku')
})

test('prompt beyond scanChars is ignored', () => {
  const long = 'x'.repeat(config.scanChars) + ' review this'
  assert.equal(route(gp('Auth module', long), config).model, config.default)
})

test('no match falls back to the default', () => {
  const d = route(gp('Auth module'), config)
  assert.equal(d.model, config.default)
  assert.equal(d.reason, 'no rule matched')
})
