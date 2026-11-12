---
name: ship-task
description: Finish a task the team way. Branch, small commit, AI_USAGE.md line, CREDITS.md check, push, and PR into main. Use when a task is done and should be merged, or when asked to commit, push, open a PR or "ship" something.
---

# Ship a task

`main` must always be playable, because GitHub Pages deploys from it. Follow these steps in order.

## 1. Branch
- If you are on `main`, create a branch first: `git switch -c <type>/<short-name>`. Use `feat/`, `fix/`, `data/`, `art/` or `docs/`.
- Get up to date first: `git pull --rebase origin main`.

## 2. Verify
- Run the `playtest` skill on anything that touches `index.html`, `src/`, `assets/` or `data/`. Do not ship a broken screen or a console error.
- Only change files in your own module, unless the task says otherwise (see AGENTS.md, "Module ownership").

## 3. Bookkeeping
- Append one line to `AI_USAGE.md`: date, tool, what it did.
- Any new asset or data file needs a row in `CREDITS.md` with source and license. No AI-generated images. No NASA logos.
- New dependency or CDN script? Stop and ask the team first.

## 4. Commit
- Keep commits small and focused. Write the message in English and imperative mood, e.g. `Add radiation shield trade-off to turn loop`.
- Stage specific files, not `git add -A`. Never commit secrets, `.playwright-mcp/` or screenshots.
- Never force-push. Never skip hooks.

## 5. Push and PR
```sh
git push -u origin HEAD
gh pr create --base main --fill
```
Keep the PR description short: what changed, how it was tested (screenshot path or a sentence).

Only merge when the user or team says so: `gh pr merge --squash --delete-branch`. After merging, check that the Pages deploy is green: `gh run list --limit 3`.
