# Curator

Fast, readable side-by-side diffs for AI-generated code changes.

Built for reviewing code you didn't write — where speed and clarity are everything.

---

## What it does

Curator tracks every file with uncommitted changes and shows them in a dedicated sidebar panel. Click any file to open a native side-by-side diff of **HEAD vs working tree** — the right pane is fully editable so you can make corrections inline.

For new files not yet committed, the left pane is blank and the full file shows as additions.

---

## Usage

1. Open the **Curator** panel in the Activity Bar (left sidebar)
2. All files with uncommitted changes appear in the tree
3. Click a file to open the diff — left is HEAD, right is your working copy
4. Edit on the right pane as needed; the diff updates in real time

---

## Install

**From source:**

```bash
npm install
npm run compile
npx @vscode/vsce package --no-dependencies
```

Then in VS Code: **Extensions: Install from VSIX...** and select `curator-0.0.1.vsix`.

---

## Requirements

- VS Code 1.80+
- The built-in **Git** extension must be enabled (it is by default)
