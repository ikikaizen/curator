import * as vscode from 'vscode';
import * as path from 'path';
import { getRepo, getChangedFiles, getRemoteChangedFiles, getUpstreamRef, Change } from './git';
import { ChangedFilesProvider } from './tree';
import { DiffProvider, toOriginalUri } from './diffProvider';

type Mode = 'local' | 'remote';

export function activate(context: vscode.ExtensionContext): void {
    // get the root folder of the workspace
    const workspaceUri = vscode.workspace.workspaceFolders?.[0].uri;
    if (!workspaceUri) {
        vscode.window.showErrorMessage('Curator: No workspace open.');
        return;
    }

    // get the git repo for the workspace
    const repo = getRepo(workspaceUri);
    if (!repo) { return; }

    // map of fsPath → Change, keeps track of all files shown in the panel
    const files = new Map<string, Change>();

    // current mode: local = HEAD ↔ working tree, remote = upstream ↔ working tree
    let mode: Mode = 'local';

    // sidebar tree showing all changed files
    const treeProvider = new ChangedFilesProvider(files);
    vscode.window.registerTreeDataProvider('curator.changedFiles', treeProvider);

    // virtual document provider for the left pane of the diff
    const diffProvider = new DiffProvider(repo.rootUri.fsPath);
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(DiffProvider.scheme, diffProvider)
    );

    // set initial context so the correct toggle button is visible
    vscode.commands.executeCommand('setContext', 'curator.mode', mode);

    // load all changed files into the map and refresh the tree
    const load = () => {
        files.clear();
        const changes = mode === 'remote'
            ? getRemoteChangedFiles(repo.rootUri.fsPath)
            : getChangedFiles(repo);
        for (const c of changes) {
            files.set(c.uri.fsPath, c);
        }
        treeProvider.refresh();
    };

    // run once on startup to populate the map
    load();

    // re-run load whenever git state changes (save, stage, commit, etc.)
    const watcher = repo.state.onDidChange(load);

    const switchMode = (next: Mode) => {
        mode = next;
        vscode.commands.executeCommand('setContext', 'curator.mode', mode);

        const ref = mode === 'remote'
            ? getUpstreamRef(repo.rootUri.fsPath)
            : 'HEAD';

        diffProvider.setRef(ref, [...files.values()].map(c => c.uri));
        load();
    };

    context.subscriptions.push(
        watcher,

        // open the native VS Code diff editor when a file is clicked in the tree
        vscode.commands.registerCommand('curator.openDiff', (fileUri: vscode.Uri) => {
            const original = toOriginalUri(fileUri);
            const filename = path.basename(fileUri.fsPath);
            const label = mode === 'remote'
                ? `${filename}  (Remote ↔ Working)`
                : `${filename}  (HEAD ↔ Working)`;
            vscode.commands.executeCommand('vscode.diff', original, fileUri, label);
        }),

        vscode.commands.registerCommand('curator.switchToRemote', () => switchMode('remote')),
        vscode.commands.registerCommand('curator.switchToLocal',  () => switchMode('local')),
    );
}

export function deactivate(): void {}
