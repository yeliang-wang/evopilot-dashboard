# Summary

Describe the user, operator, project owner, or AI Agent workflow affected by this change.

## Scope

- [ ] Agent Console UI
- [ ] API compatibility
- [ ] ProjectHarnessProfile review
- [ ] Evidence Drawer
- [ ] Documentation or open-source productization
- [ ] Tests or validation only

## Dashboard Boundary Checklist

- [ ] Keeps EvoPilot API as the system of record.
- [ ] Does not call the EvoPilot CLI from browser code.
- [ ] Does not read EvoPilot local data files or evidence folders.
- [ ] Preserves ProjectHarnessProfile owner review before activation.
- [ ] Preserves stop behavior for blockers, nextAction, NO-GO, BLOCKED, FAILED, policy review, credential repair, LLM repair, and human approval.

## Validation

Paste commands and results:

```bash
npm run check
git diff --check
```

Add `npm run smoke:console` when API compatibility is affected.
