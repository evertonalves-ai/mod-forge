# Regression checklist for a mod being improved

Write these before changing code; they must pass before and after.
- each command: reply text for a normal and an invalid argument;
- each `tool.call` hook: an irrelevant tool passes through unchanged; the matching tool gets the documented effect;
- each guard: block path, allow path, fail-closed path;
- each render site: draws on `terminal` and `desktop`; each control by key changes what it should;
- each persisted value: written to `$.store`, reloaded after `classic.SessionStart({ source: 'clear' })`;
- each `userConfig` option: both values via `test(name, { options }, …)`.
