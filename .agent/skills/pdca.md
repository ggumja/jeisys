---
name: pdca
description: |
  Unified skill for managing the entire PDCA cycle.
  Supports Plan → Design → Do → Check → Act workflow.
---

# PDCA Skill

This skill implements the bkit PDCA workflow.

## Actions

### plan [feature]
- Create/Update Planning document in `docs/bkit/plan/{feature}.plan.md`
- Outline Purpose, Scope, Requirements, and Success Criteria.

### design [feature]
- Create/Update Design document in `docs/bkit/design/{feature}.design.md`
- Define Architecture, UI/UX, Component structure, and API specs.

### do [feature]
- Execute implementation based on the design.
- Proactively fix issues and follow project conventions.

### analyze [feature]
- Compare implementation with design.
- Identify gaps and calculate match rate.

### iterate [feature]
- Auto-fix gaps identified in the analyze phase.

### report [feature]
- Generate a final completion report in `docs/bkit/reports/{feature}.report.md`.

### status
- List all active PDCA processes and their current phases.

### next
- Propose the logical next step in the current PDCA cycle.
