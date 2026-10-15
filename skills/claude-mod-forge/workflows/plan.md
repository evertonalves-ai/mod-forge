# Workflow: plan only

Use when the user asks for a design first, or the mod is large or risky. Produces a spec, writes no mod code.

1. Ground truth (SKILL.md §0). Read the `.d.ts` sections for every event and method the idea seems to need,
   and confirm each exists in this build. List anything that does not exist and what can replace it.
2. Interview (`references/discovery-and-quiz.md`) until every field of `templates/project-spec.md` has an answer
   or a stated assumption.
3. Fill `templates/project-spec.md`, `templates/test-plan.md` and, for any risky capability, `templates/security-review.md`.
   Save them as `MOD-SPEC.md`, `TEST-PLAN.md`, `SECURITY.md` in the planned mod folder (or in chat if no folder yet).
4. Call out explicitly:
   - data sources that are real vs. not available;
   - surfaces where it will draw vs. only run hooks;
   - any decision that touches safety or native behaviour (needs the user's yes);
   - acceptance criteria the user can check by hand.
5. Stop. Offer to switch to create.
