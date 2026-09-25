#!/bin/sh
# Clipper AI dev launcher — Vite only.
#
# The Freebuff platform already runs the Convex dev process (function push +
# codegen) in its own managed background session. This script must NOT start a
# second `convex dev`: doing so seizes the local backend port (3210), which makes
# the platform's `convex dev --once` codegen/typecheck fail and leaves stale
# functions deployed — the UI then shows outdated behaviour.
#
# For manual local development outside Freebuff, run `bun run convex:dev` in a
# second terminal.
set -e

# 5173 may be occupied by a stale workspace process; use a collision-resistant
# default while still honoring the platform-provided PORT when present.
exec vite --host 0.0.0.0 --port "${PORT:-5174}" --strictPort
