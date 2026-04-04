# this.

Fast, readable side-by-side diffs for AI-generated code changes.

Built for reviewing code you didn't write — where speed and clarity are everything.

---

## What it does

When an AI edits a file, `this.` gives you an instant split-pane diff of **HEAD vs working tree** without leaving the editor. A status bar badge lights up on every file with uncommitted changes. If the AI makes another edit while the diff is open, the right pane updates automatically.

---

## Install

**From source (dev mode):**

```bash
npm install
npm run compile
```

Then press **F5** in VS Code to launch the Extension Development Host. The extension activates immediately.

**Package as `.vsix`:**

```bash
npm install -g @vscode/vsce
vsce package --no-dependencies
code --install-extension this-0.0.1.vsix
```

---

## Usage

### Status bar

When the active file has uncommitted changes, a `$(diff) filename.ts` badge appears in the bottom-left status bar. If a diff is already open, it shows line stats inline: `$(diff) filename.ts  +12 −3`.

Click the badge to open the diff for the active file.

### Keyboard shortcuts

| Action | Windows / Linux | macOS |
|---|---|---|
| Diff active file | `Alt+D` | `Alt+D` |
| Pick from all changed files | `Alt+Shift+D` | `Alt+Shift+D` |

Shortcuts are configurable via **File → Preferences → Keyboard Shortcuts** — search for `this`.

### Command palette

Open with `Ctrl+Shift+P` / `Cmd+Shift+P`:

| Command | Description |
|---|---|
| `this: Show Diff` | Diff the active file against HEAD |
| `this: Pick Changed File` | QuickPick across all files with uncommitted changes |

### Editor title bar

The `$(diff)` and `$(list-unordered)` icon buttons appear in the editor tab's title bar (top-right area) when a file is open. They're always one click away without touching the keyboard.

### Right-click context menu

Right-click anywhere in an editor → **Show Diff** to diff the current file.

---

## How the diff view works

- **Left pane** — the committed version (HEAD), served by an in-memory content provider so no temp files are created.
- **Right pane** — the actual working tree file, live. Any further AI edits appear here immediately.
- **Title** — shows the filename and `+N −N` stats at the moment the diff opens.
- **Auto-refresh** — on save, the diff pane re-renders and the status bar stats update.

For new files not yet in git (untracked), the left pane is blank, showing the full file as additions.

---

## Requirements

- VS Code 1.80+
- The built-in **Git** extension must be enabled (it is by default). No external `git` CLI calls are made — everything goes through `vscode.extensions.getExtension('vscode.git')`.

---

## Configuration

No settings yet — the extension is intentionally zero-config. Keybindings can be changed via the standard VS Code keybindings editor.
