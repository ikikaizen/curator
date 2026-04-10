# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Curator is a VS Code extension that provides fast side-by-side diffs for reviewing AI-generated code changes. It tracks uncommitted files and displays them in a sidebar panel, opening native VS Code diffs (HEAD vs. working tree) on click.

## Commands

```bash
make install   # npm install
make compile   # tsc -p ./  (output → out/)
make package   # produces .vsix via @vscode/vsce
make test      # jest

npm run watch  # watch mode compile
```

## Architecture

Four source files in `src/`, each with a single responsibility:

- **`extension.ts`** — Entry point. `activate()` wires everything together. Owns the `files: Map<string, Change>` state and the `load()` function that refreshes it. Listens to `repo.state.onDidChange` to trigger refreshes.

- **`git.ts`** — Thin wrapper around VS Code's built-in Git Extension API (not shell git directly). Key functions: `getRepo()`, `getChangedFiles()`, `getHeadContent()`. Uses `execFileSync` for `git show HEAD:<path>` to fetch committed content.

- **`tree.ts`** — `ChangedFilesProvider` implements `TreeDataProvider<Change>`. Renders the sidebar list and maps file status to icons.

- **`diffProvider.ts`** — Implements `TextDocumentContentProvider` for the `curator://` URI scheme. Supplies HEAD content as the left (read-only) pane when VS Code opens a diff.

**Data flow:**
```
repo.state.onDidChange → load() → getChangedFiles() → files Map
  → treeProvider.refresh() → user clicks file
  → curator.openDiff command → vscode.diff()
  → diffProvider supplies HEAD content (left pane)
```

## Development Workflow

- Every new feature must be developed on a new branch (never directly on `main`).
- Every change must include tests covering the new behavior.

## Key Design Notes

- The extension depends on VS Code's built-in Git Extension being active. `getRepo()` returns `null` if git is unavailable.
- New (untracked) files have an empty string as HEAD content — the diff left pane will be blank, showing the whole file as additions.
- The compiled output goes to `out/`; the VSIX packages only `out/` (not `src/`).
- Activation is deferred to `onStartupFinished` for minimal startup overhead.
