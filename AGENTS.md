# Interview Lab contributor guidance

- Preserve the existing restrained purple/white design and text-first practice flows.
- This is a buildless static website; no framework or dependency installation is necessary.
- Run `npm run check` and `npm test` before submitting changes.
- Keep study material in data/*.json, not embedded in JavaScript.
- Preserve stable question IDs and topic index meanings. Import supports legacy numeric IDs from the original Site.
- Keep draft saving, backup export/import and failed-restore recovery working.
- Cloud backup is manual and optional. Never describe it as automatic sync or connected before a real project is configured and tested.
- Never commit private exports, authentication tokens or service-role/secret keys.
- RLS must remain enabled with owner-scoped policies. Do not weaken authorization to resolve a client error.
- Do not automatically grade written answers or claim code execution; implementation/testing happens in Codex or Claude Code.
