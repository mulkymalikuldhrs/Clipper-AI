# Super Clipper — Agent ecosystem research

**Last reviewed:** 25 September 2026  
**Decision:** reuse architecture patterns, not unrestricted execution or unreviewed credentials.

## Repositories reviewed

| Repository | Useful pattern | Super Clipper decision |
|---|---|---|
| [our-ark/enoch](https://github.com/our-ark/enoch) | Identity/body/memory separation; governed evolution; lineage; reviewable tasks | Keep identity, role, memory, and skill proposals explicit. Do not allow self-modifying production code. |
| [mutonby/openshorts](https://github.com/mutonby/openshorts) | Local/self-hosted clip stages; OpenAI-compatible endpoint; MCP/API boundary; moment ranking | Keep rendering and publishing outside the current Convex runtime. Use source-backed brief/spec handoffs. |
| [open-multi-agent/open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) | Durable approvals; task DAGs; shared memory; verifiable run records; custom base URLs | Adopt bounded roles, shared context, evaluation, and review gates. Do not add a second hosted control plane yet. |
| [MiroShark/MiroShark](https://github.com/MiroShark/MiroShark) | Grounded multi-agent simulation and context layers | Use only as a future batch evaluation/sandbox pattern. Never let simulation actions reach production accounts. |
| [666ghj/MiroFish](https://github.com/666ghj/MiroFish) | Seed data, simulated worlds, large agent populations, early stopping | Useful for scenario testing and sensitivity analysis, not for marketplace execution. |
| [chrisworsey55/atlas-gic](https://github.com/chrisworsey55/atlas-gic) | Market feedback, low/high-level reflection, prompt evolution | Adapt reflection/evaluation loops only with bounded risk and human adoption. |
| [PrimeIntellect-ai/prime-agent](https://github.com/PrimeIntellect-ai/prime-agent) | Continual harness; durable sessions; subagents; schedules; skills; rollback | Adopt session/memory/skill lifecycle. Do not copy its host-level shell or Python execution into Convex. |
| [danielmiessler/LifeOS](https://github.com/danielmiessler/LifeOS) | Personal context, memory, routing, custom skills, self-improvement | Adopt explicit context and skill routing. Keep identity data local and user-controlled. |
| [maxmiksa/auto-company](https://github.com/maxmiksa/auto-company) | Explicit expert roles, consensus memory, continuous cycle, budgets | Adopt role cards and consensus summaries. Do not adopt unattended deployment or marketing. |
| [JayWebtech/autoshorts](https://github.com/JayWebtech/autoshorts) | Local-first media project, dynamic multi-LLM, offline model option, warning-first UX | Keep media rendering local-first and expose missing capability honestly. |

## Current implementation

`src/lib/agentSwarm.ts` provides a browser-safe foundation:

- explicit role definitions;
- max four calls per run;
- shared capped transcript and memory;
- OpenAI-compatible custom base URL/model;
- API key only in sessionStorage;
- deterministic evaluation of goal, output, and evidence;
- skill proposals that begin as `review_required`;
- local session persistence with a bounded history.

`src/pages/dashboard/Swarm.tsx` exposes session creation, provider configuration, role selection, run, evaluate, browser heartbeat, memory, connector catalog, and skill approval/rejection.

`src/convex/connectors.ts` keeps Apify and Whop credentials server-side. Apify Actor IDs and Whop endpoints are bounded; neither action is a general arbitrary URL proxy.

## Safety model

1. Generation is not execution.
2. Evaluation is separate from model output.
3. Skills are proposals until approved.
4. Secrets are environment/session scoped, never source-controlled.
5. External or consequential actions require human review.
6. Simulation and self-improvement never gain marketplace credentials.
7. A failed provider or missing evidence should result in `needs_evidence` or `do_nothing`.

## Next research questions

- Which Convex-native durable runtime should replace browser-only sessions for authenticated workspaces?
- How should model routing account for role, cost, latency, and privacy?
- Which Apify Actors can be allowlisted and normalized into campaign intelligence?
- How can webhook signatures and replay protection be standardized across connectors?
- Which evaluator datasets can measure plan quality without optimizing for unsafe engagement?
