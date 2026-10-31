# model-router

![status: beta](https://img.shields.io/badge/status-beta-orange)

Rule-based model routing for Claude Code, as a plugin. Cheap work (finding
files, reading logs, summarising) runs on Haiku, well-specified edits run on
Sonnet, and review, security and design questions run on Opus, while the main
session stays on whatever model you chose. Node only, no dependencies.

Status: beta. A working prototype that has not been run in daily use yet;
the rules, agent names and hook output may change without notice.

## Why subagents, not switching the main model

The prompt cache belongs to one model. Switching the main session's model
mid-conversation makes the new model read the whole context again at full
price, which usually costs more than it saves. A subagent starts with an empty
context anyway, so sending it to a cheaper model loses nothing. The savings
come from what the subagent reads (file dumps, logs, search results) being
billed at the cheap rate and never entering the main context.

Context is shared through a fixed shape: a short brief going in
([`HANDOFF.md`](HANDOFF.md)) and a fixed report format coming out (in each
agent's definition).

## What is in it

| Piece | File | What it does |
| ----- | ---- | ------------ |
| Agents | `agents/scout.md`, `implementer.md`, `reviewer.md` | Read-only Haiku scout, Sonnet implementer, read-only Opus reviewer, each with a fixed report format |
| Routing hook | `scripts/route-agent.mjs` | `PreToolUse` on `Agent`: an untyped or `general-purpose` call with no `model` gets one from `rules.json` |
| Session hook | `scripts/session-context.mjs` | `SessionStart`: tells the main session which agent fits which task |
| Rules | `rules.json` | Ordered regex rules over the call's description and the start of its prompt; first match wins |
| Report | `scripts/route-report.mjs` | Tallies the route log by model and rule, and lists calls no rule matched |

## How a call is routed

1. The call already names a `model`: left alone.
2. The call names a typed agent (`Explore`, `model-router:scout`, ...): left
   alone, its own definition picks the model.
3. Otherwise the description plus the first `scanChars` characters of the
   prompt are matched against `rules`, in order. `escalate-hard` comes first,
   so "find security holes" goes to Opus, not Haiku.
4. No rule matches: `default` (`null` means the subagent inherits the main
   model, as Claude Code does today).

Every decision is appended to `route-log.jsonl` in the plugin's data folder
(`MODEL_ROUTER_LOG` overrides the path, `MODEL_ROUTER_RULES` the rules file).

## Try it without installing

```bash
MODEL_ROUTER_LOG=$TMPDIR/route-log.jsonl claude --plugin-dir ~/development/maslach/model-router
```

That loads the plugin for one session only, with the log at a known path.
Ask for a few delegated tasks, then:

```bash
node scripts/route-report.mjs $TMPDIR/route-log.jsonl
```

## Develop

```bash
npm test      # router rules and the hook's stdin/stdout contract
npm run lint  # syntax and JSON checks
```

## Limits

- Keyword rules are crude. The report's "unmatched" list is there to grow them
  from real traffic; a small classifier is the next step if regexes stop being
  enough.
- The hook returns `permissionDecision: "allow"`, which `updatedInput`
  requires. Agent calls do not prompt by default, so this changes nothing in
  practice, but a deny rule on `Agent` would be bypassed for routed calls.
- Routing to a smaller model trades quality for cost. Only route well-defined
  work down; anything ambiguous belongs on the main thread.

## Who wrote this

Parts of this plugin were written with the help of a superintelligence. Or at
least something that types faster than we do and never needs coffee. A human
steered it, tested it and answers the issues, so the bugs are a joint effort.

## License

MIT for the code; the Maslach name and logo are not part of it. See
[`NOTICE.md`](NOTICE.md).
