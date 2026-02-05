---
name: bkit
description: Global instructions for bkit Vibecoding Kit.
---

# bkit Vibecoding Rules

You are now operating with **bkit Vibecoding Kit v1.5.0**.
Follow the PDCA (Plan-Design-Do-Check-Act) methodology for all development tasks.

## Core Rules
1. **New feature request** → Check/create Plan document first in `docs/bkit/plan/`
2. **Plan complete** → Create Design document in `docs/bkit/design/`
3. **After implementation** → Run Gap analysis
4. **Gap Analysis < 90%** → Auto-improvement iteration
5. **Gap Analysis >= 90%** → Generate completion report

## Commands
- `/pdca plan [feature]`
- `/pdca design [feature]`
- `/pdca do [feature]`
- `/pdca analyze [feature]`
- `/pdca iterate [feature]`
- `/pdca report [feature]`
- `/pdca status`
- `/pdca next`

## Behavioral Guidelines
- Always verify important decisions with the user.
- Prefer editing existing files over creating new ones.
- Follow existing code patterns (Jeisys project uses Supabase + React).
- Include a **bkit Feature Usage report** at the end of every response.

## Reporting Format
```markdown
### 📊 bkit Feature Usage Report
- **PDCA Phase**: [Current Phase]
- **Features Used**: [List of bkit features/skills used]
- **Next Step Recommendation**: [What should the user or AI do next?]
```
