// Pure routing logic: given an Agent tool_input and a rules config, decide
// which model the subagent should run on. No I/O here so it is easy to test.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export function loadRules(path = process.env.MODEL_ROUTER_RULES || join(ROOT, 'rules.json')) {
  const config = JSON.parse(readFileSync(path, 'utf8'))
  return {
    ...config,
    rules: config.rules.map(r => ({ ...r, re: new RegExp(r.pattern, 'i') }))
  }
}

// Returns { model, rule, reason }. model null means "leave the call alone".
export function route(input, config) {
  if (input.model) return { model: null, rule: null, reason: 'explicit model' }

  const type = input.subagent_type ?? ''
  if (!config.routeTypes.includes(type)) {
    return { model: null, rule: null, reason: `type ${type} keeps its own model` }
  }

  // The description is the caller's own summary of the task, so it goes
  // first; the prompt is cut short because briefs bury the verb under context.
  const text = `${input.description ?? ''}\n${(input.prompt ?? '').slice(0, config.scanChars)}`
  for (const rule of config.rules) {
    if (rule.re.test(text)) return { model: rule.model, rule: rule.name, reason: 'matched' }
  }
  return { model: config.default, rule: null, reason: 'no rule matched' }
}
