// Summarise the route log: how many subagent calls went to each model and
// which rule sent them there. Usage: node scripts/route-report.mjs [log.jsonl]

import { readFileSync } from 'node:fs'

const path = process.argv[2] || process.env.MODEL_ROUTER_LOG || 'route-log.jsonl'
const rows = readFileSync(path, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))

const tally = {}
for (const r of rows) {
  const key = `${r.model ?? 'unchanged'}\t${r.rule ?? r.reason}`
  tally[key] = (tally[key] ?? 0) + 1
}

console.log(`${rows.length} subagent calls in ${path}\n`)
console.log('count\tmodel\trule')
for (const [key, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`${n}\t${key}`)

const unmatched = rows.filter(r => r.reason === 'no rule matched')
if (unmatched.length) {
  console.log('\nUnmatched descriptions (candidates for new rules):')
  for (const r of unmatched.slice(-15)) console.log(`  ${r.description}`)
}
