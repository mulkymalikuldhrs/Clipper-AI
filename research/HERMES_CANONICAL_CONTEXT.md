# HERMES Canonical Strategic Context: Autonomous Venture Organism

**Document Version:** 1.0.0
**Context Scope:** Strategic foundation for Super Clipper as an Autonomous Venture Organism
**Effective Date:** September 24, 2026

---

## 1. Executive Summary & Vision

Super Clipper is designed as a self-sustaining **Autonomous Venture Organism** for the digital content clipping economy. Rather than functioning merely as an isolated tool or static dashboard, Super Clipper integrates:

1. **Marketplace Intelligence:** Real-time observation and normalization of campaign briefs, economics, and clipper leaderboards.
2. **Deterministic Production Autopilot:** Clean-room conversion of brief constraints into structured video plans, 9:16 clip candidate specs (AutoShorts-compatible), captions, hooks, and compliance checklists.
3. **Bounded Organism Kernel:** A governing plane featuring a Constitution, dynamic goal prioritization, capability inventory, provenance-tagged memory, and experiment ledgers.
4. **Human-in-the-Loop Safety Boundary:** Review-gated social handoffs and local bridge execution ensuring zero unauthorized automation, fake engagement, or credential leakage.

---

## 2. Core Strategic Principles (The Constitution)

### Principle I: Truth and Provenance
Every operational decision, campaign ranking, and autopilot recommendation must trace back to verifiable data from the source marketplace brief or local execution metrics. Unverified model hallucinations or assumed campaign constraints are strictly prohibited.

### Principle II: Operator Autonomy & Human-in-the-Loop
The organism assists, accelerates, and prioritizes work for human clippers. The final creative approval, footage capture, video editing, and social media publication remain under explicit human control (`review_required`).

### Principle III: Zero Credential Exposure
User credentials, cookies, and API keys reside strictly on the user's local machine or browser session storage. No third-party platform passwords, cookies, or secret tokens are stored in repository commits or cloud database payloads.

### Principle IV: Bounded Self-Evolution
The organism kernel may evaluate performance, adjust goal prioritization, and adopt measured improvements only when backed by empirical evidence (e.g. >10% score improvement and risk score ≤ 0.50). The kernel cannot modify its underlying codebase, execute host shell commands, or perform unauthorized financial or network transactions.

---

## 3. Operational Operating Loop

```text
┌────────────────────────┐      Local Bridge / Session Sync       ┌────────────────────────┐
│  konten.com            │ ─────────────────────────────────────► │  Ingest Validation     │
│  Marketplace Data      │     Campaigns, Briefs, Earnings        │  Bounded HTTP Action   │
└────────────────────────┘                                        └───────────┬────────────┘
                                                                              │
                                                                  ┌───────────▼────────────┐
                                                                  │  Convex Snapshot &     │
                                                                  │  Campaign Cache        │
                                                                  └───────────┬────────────┘
                                                                              │
                                                                  ┌───────────▼────────────┐
                                                                  │  Organism Kernel &     │
                                                                  │  Autopilot Engine      │
                                                                  │  - Brief Parser        │
                                                                  │  - AutoShorts Manifest │
                                                                  │  - Goal Selection      │
                                                                  └───────────┬────────────┘
                                                                              │
                                                                  ┌───────────▼────────────┐
                                                                  │  Human Operator        │
                                                                  │  Review & Handoff      │
                                                                  │  (review_required)     │
                                                                  └────────────────────────┘
```

---

## 4. Capability Maturity & Roadmap Context

### Horizon 1: Foundation & Triage (Current MVP)
- Real-time marketplace sync via local Playwright bridge.
- Transparent campaign scoring based on CPM, remaining budget, competition, and view thresholds.
- Deterministic Brief Autopilot generating shotlists, do/don't compliance rules, and captions.
- Bounded Organism Kernel with goal selection and local provider configuration UI.

### Horizon 2: Local Production Acceleration (Active Development)
- AutoShorts 9:16 candidate manifest export for local FFmpeg/rendering engines.
- Review-gated social publishing queue supporting official TikTok Posting API & Instagram Graph API metadata.
- Provenance-tagged performance memory tracking campaign yield and actual clipper earnings.

### Horizon 3: Autonomous Venture Expansion (Future Scope)
- Automated feedback loops re-ranking brief opportunities based on historically measured view conversion.
- Collaborative multi-clipper workspace plans with versioned shotlist reviews.
- Opt-in local AI model adapters (Ollama, vLLM, ComfyUI) with explicit cost metering and sandbox isolation.

---

## 5. Verification & Governance Summary

This canonical context governs all feature implementations, schema changes, and pull requests in the Super Clipper repository. Any proposed change that violates the core constitutional boundaries or attempts to bypass operator review must be rejected.
