---
name: ship-task
description: Finish a task the team way. Branch, npm test, small commit, SI_USAGE.md line, CREDITS.md check, merge origin/main, push, and a PR that says who did the work. Use when a task is done and should be merged, or when asked to commit, push, open a PR or "ship" something.
---

# Ship a task

`main` must always be playable, because GitHub Pages deploys from it. Follow these steps in order.

## 1. Branch
- If you are on `main`, create a branch first: `git switch -c <type>/<short-name>`. Use `feat/`, `fix/`, `data/`, `art/` or `docs/`.
- Get up to date first: `git pull --rebase origin main`.
- Before you create a new file: `git fetch` and check that the name is free on `main` (`git ls-tree --name-only origin/main`). One topic, one file: add a section to `FEEDBACK.md`, `RESEARCH.md` or `GAME_DESIGN.md` instead of a new file with a similar name.

## 2. Verify
- `npm test` passes.
- Run the `playtest` skill on anything that touches `index.html`, `src/`, `assets/` or `data/`. Do not ship a broken screen or a console error.
- Only change files in your own module, unless the task says otherwise (see AGENTS.md, "Module ownership").

## 3. Bookkeeping
- Append one line to `SI_USAGE.md`: date, SI tool, what it did. Add new files to `si-manifest.json`. Write "SI" (Super Intelligence, the Space Apps term), never "AI".
- Any new asset or data file needs a row in `CREDITS.md` with source and license. No SI-generated images. No NASA logos.
- New dependency or CDN script? Stop and ask the team first.

## 4. Commit
- Keep commits small and focused. Write the message in English and imperative mood, e.g. `Add radiation shield trade-off to turn loop`.
- Stage specific files, not `git add -A`. Never commit secrets, `.playwright-mcp/` or screenshots.
- Never force-push. Never skip hooks.

## 5. Push and PR
Two laptops push to the same repo, so merge `main` in right before pushing:
```sh
git fetch origin && git merge origin/main && npm test
git push -u origin HEAD
gh pr create --base main --title "<what changed>" --body "<body>"
```
- In a conflict in `SI_USAGE.md` or `si-manifest.json`, keep the lines from both sides.
- The PR body starts with **who did the work**, e.g. `Done by: Florian.` Both laptops commit as the same GitHub account, so this is the only place it shows. Name the person only: SI tools are logged in `SI_USAGE.md`, not in the PR.
- Keep the rest short: what changed and how it was tested (screenshot path or a sentence).

Only merge when the user or team says so for this PR. Merge `origin/main` into the branch again and run `npm test` first, then `gh pr merge --squash --delete-branch`. After merging, check that the Pages deploy is green: `gh run list --limit 3`.
