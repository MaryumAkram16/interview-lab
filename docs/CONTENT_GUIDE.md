# Add your own study material

## Questions

Edit `data/questions.json`. Each object uses:

```json
{
  "id": "q-python-counting",
  "t": 1,
  "title": "Count repeated words",
  "type": "Coding",
  "min": 15,
  "q": "Write a Python function that counts words. Explain case handling.",
  "h": ["Which structure counts occurrences?", "Walk through one token at a time and update a dictionary."],
  "s": "Reference solution and explanation here."
}
```

Use a unique `q-` ID containing letters, digits or hyphens. Keep an ID forever once used: answers and progress refer to it. Reordering questions is supported. Keep seed IDs q-001 through q-009 because guided sessions refer to them. To retire a seed, first update the corresponding guided path in assets/app.js.

`t` is the topic index in `data/topics.json`:

0 hashing/data structures; 1 Python; 2 APIs/HTTP; 3 idempotency/retries; 4 concurrency; 5 databases; 6 RAG; 7 train/evaluation separation.

Use Coding, Concept or Scenario as the type, a positive minute count, and exactly two hints. Run `npm run check` after editing. Keep content plain text rather than HTML. Escape JSON newlines as `\n` and double quotes as `\"`.

## Cheat sheets

Edit `data/cheat-sheets.json`. Backend and DSA each contain pairs:

```json
["Heading", "Your explanation, examples and reminders."]
```

Upload reference PDFs or Markdown to a separate folder if useful, but the current website renders the JSON sheets. Files added to GitHub are not automatically parsed into questions. Ask Codex or Claude Code to convert your material into this structure, retain your wording, and run the checks.

## Personal practice data

Use Progress → Export/Import or the optional cloud backup. Never commit exported answers, database credentials or passwords to this public repo. The `.gitignore` excludes progress export filenames, but still review staged files before committing.
