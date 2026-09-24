# Agent and Autonomous Video Research Record (Second Pass)

## Overview

This document records the second-pass research analyzing autonomous agent frameworks, video processing pipelines, durable execution engines, and safety patterns for Super Clipper.

Super Clipper adopts proven architectural patterns from these open source systems while remaining a clean-room, human-in-the-loop operating console. No third-party source code or unlicensed artifacts are copied into the repository.

---

## Studied Repositories and Architectural Patterns

### 1. OpenShorts (`mutonby/openshorts`)
- **Key Patterns:** Self-hostable video clipping pipeline, local LLM/Whisper endpoints, async rendering queue, explicit GPU/CPU job boundaries.
- **Super Clipper Application:** Clean-room AutoShorts candidate candidate manifest generator (`src/lib/autoshorts.ts`) emitting 9:16 specs (hook, core proof, CTA) for local rendering without running desktop desktop processes or FFmpeg inside the Vite/Convex console.

### 2. VideoAgent (`HKUDS/VideoAgent`)
- **Key Patterns:** Intent decomposition, structured graph planning, adaptive feedback loops, automated video quality evaluation.
- **Super Clipper Application:** Deterministic Brief Autopilot (`src/convex/brief.ts`) transforming marketplace briefs into segmented shotlists, compliance checklists, and structured hook/CTA plans.

### 3. CORAL (`Human-Agent-Society/CORAL`)
- **Key Patterns:** Multi-agent collaboration, isolated worktrees, grader daemon, shared memory repository, bounded self-evolution.
- **Super Clipper Application:** Bounded Organism Kernel (`src/convex/lib/organism.ts`) with Constitution, dynamic goals, capability registry, experiment ledger, and do-nothing safety controls.

### 4. Prime Agent (`PrimeIntellect-ai/prime-agent`)
- **Key Patterns:** Continual evaluation harness, provenance-tagged memory, subagent isolation, bounded autonomy tiers.
- **Super Clipper Application:** User-scoped provenance tagging on organism memories and strict lifecycle rules for campaign autonomy reviews.

### 5. Hermes Agent (`NousResearch/hermes-agent`)
- **Key Patterns:** Hierarchical memory, skill lifecycle, scheduled execution, local execution boundaries, tool sandboxing.
- **Super Clipper Application:** Local provider configuration UI (`/app/organism`) allowing users to connect local OpenAI-compatible endpoints (e.g. Ollama, vLLM) with session-only key storage and client-side URL validation.

### 6. AutoResearchClaw (`aiming-lab/AutoResearchClaw`)
- **Key Patterns:** Time-decayed lesson memory, candidate hypothesis verification, pivot/refine/proceed logic, explicit human intervention gates.
- **Super Clipper Application:** Experiment adoption policy requiring at least 10% measured improvement and risk below 0.50 before candidate adoption.

### 7. OpenClaw (`openclaw/openclaw`) & OpenFang (`RightNow-AI/openfang`)
- **Key Patterns:** Local-first gateway, untrusted inbound validation, manifest approval gates, audit trails, resource metering.
- **Super Clipper Application:** Bounded HTTP ingest validation (`/ingest`) with body limits (1 MiB), array bounds, request ID deduplication, and 30-day sync log retention.

### 8. Swarm, LangGraph, AutoGen
- **Key Patterns:** Stateful graph execution, checkpointing, human-in-the-loop breakpoints, handoffs.
- **Super Clipper Application:** Campaign autonomy queue (`src/lib/autonomy.ts`) enforcing `review_required` publishing handoffs and explicit operator review gates.

---

## Safety and Trust Boundaries

1. **No Unrestricted Execution:** The Organism Kernel does not execute shell commands, filesystem mutations, browser automation, or cloud spending.
2. **Review-Gated Publishing:** Social publishing handoffs (`/app/accounts`) enforce `review_required` status until official OAuth tokens and platform posting APIs are configured.
3. **Local Secrets:** API keys for optional local/external providers are stored exclusively in `sessionStorage` and never transmitted to Convex or stored in git.
4. **Data Minimization:** Marketplace ingest payloads are validated and bounded to prevent workspace bloating or unauthorized data exposure.

---

## Reuse Summary Table

| Source Framework | Learned Pattern | Adoption in Super Clipper |
|---|---|---|
| OpenShorts | 9:16 clip candidate generation | `buildAutoShortsManifest()` JSON spec export |
| VideoAgent | Goal & shotlist decomposition | Deterministic brief parser & shotlist generator |
| CORAL / Prime | Bounded self-evolution & memory | Organism profile, experiment ledger & memories |
| Hermes Agent | Local provider adapter | Local provider config UI with sessionStorage key |
| OpenClaw | Untrusted payload validation | Bounded bridge ingest & request deduplication |
| LangGraph / Swarm | Human-in-the-loop review gates | Autonomy queue with mandatory `review_required` handoffs |

---

*Research verified and applied to Super Clipper architecture on September 24, 2026.*
