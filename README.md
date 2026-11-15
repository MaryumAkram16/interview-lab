# Interview Lab

Maryum’s text-first practice workspace for Applied AI and remote backend roles. Includes guided sessions, timed Python tasks, progressive hints, reference answers, retry queues, self-review, cheat sheets and Claude Code prompts.

## Run locally

No npm dependencies or build step. Use Node 22+ for checks and Python 3 for the development server:

```sh
npm run dev
```

Open http://localhost:8000. Do not open index.html directly: content loads through HTTP. Run `npm run check` and `npm test` before committing.

## Edit your content

| File | What it contains |
| --- | --- |
| `data/questions.json` | Questions, two progressive hints, reference answers, timer length and stable IDs |
| `data/cheat-sheets.json` | Backend Engineering and DSA/Python cheat sheets |
| `data/topics.json` | The eight focus areas; preserve their order |
| `assets/app.js` | Practice flows, progress, browser storage and JSON backup |
| `assets/cloud.js` | Optional Supabase sign-in and explicit cloud snapshots |
| `config.js` | Public Supabase project URL and publishable key; blank by default |

See [the content guide](docs/CONTENT_GUIDE.md). Your source and study material have Git history. **Personal progress is not committed to GitHub.**

## Prevent losing progress

- Browser drafts, answers, notes and reviews save locally as you work.
- Export a JSON backup in **Progress → Export progress** regularly.
- Export from the original ChatGPT Site and import into this website to migrate existing practice. Each website origin has separate browser storage.
- Optional Supabase cloud backups work after [setup](docs/SUPABASE_SETUP.md). They are **manual snapshots**, not live sync. Select Save cloud backup after practice and Restore cloud backup on another device.
- Cloud storage is not configured or verified against a live project yet. No cloud backup exists until you configure it and save one successfully.

## GitHub Pages

The repository is public. All files deployed under `data/` are publicly readable. Store personal answers in local exports or Supabase, not public content files.

1. In repository **Settings → Pages**, set **Source → GitHub Actions**.
2. Open **Actions → Deploy GitHub Pages → Run workflow** if a deployment has not started.
3. Future pushes to `main` run checks and deploy the web assets automatically.
4. Use the URL returned by the successful deployment. Pages is not live merely because the workflow file exists.

The deployment artifact contains only `index.html`, `config.js`, `assets/` and `data/`. It excludes SQL, setup docs, tests and personal exports. See [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Work with Codex / Claude Code

Use the same repository in either tool. Start with `AGENTS.md` and `docs/NEXT_TASK.md`. The app has copyable task-and-debugging prompts. It does not call a model API, run code, automatically grade answers or connect directly to Claude Code.

## Verification

`npm run check` verifies JS syntax and content structure. `npm test` checks legacy backup migration, stable-ID tracking, navigation rendering, import validation and mocked cloud conflict handling. Live Supabase authentication, SQL/RLS isolation and cross-device backup must be verified after configuration; mocked tests do not establish database security.

## Personal cheat sheet collection

The Cheat sheets page includes 25 uploaded HTML sheets with category filters and search, plus the original quick-reference summaries. Full sheets open in a new tab with their original formatting. Edit the files in `data/cheatsheets/` and their metadata in `data/cheatsheet-catalog.json`. See [the duplicate review](docs/CHEATSHEET_IMPORT.md) for the 10 PDF/HTML counterpart pairs omitted from duplicate publication.

The full-length collection is grouped under six visible topic headings: DSA & Python; APIs & Reliability; Databases & Concurrency; Applied AI & LLMs; Machine Learning; Deep Learning. Search and the topic filter work across these groups. The two later handbook uploads were reviewed and not duplicated because they contain the same 25 sheets in different orders. See `docs/HANDBOOK_REVIEW.md`.
