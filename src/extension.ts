import * as vscode from 'vscode';
import * as path from 'path';
import { getRepo, getChangedFiles, Change } from './git';
import { ChangedFilesProvider } from './tree';
import { DiffProvider, toOriginalUri } from './diffProvider';

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

    // map of fsPath → Change, keeps track of all uncommitted files
    const files = new Map<string, Change>();

    // sidebar tree showing all changed files
    const treeProvider = new ChangedFilesProvider(files);
    vscode.window.registerTreeDataProvider('curator.changedFiles', treeProvider);
    
    // virtual document provider for git HEAD content (left pane of diff)
    const diffProvider = new DiffProvider(repo.rootUri.fsPath);
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(DiffProvider.scheme, diffProvider)
    );

    // load all changed files into the map and refresh the tree
    const load = () => {
        files.clear();
        for (const c of getChangedFiles(repo)) {
            files.set(c.uri.fsPath, c);
        }
        treeProvider.refresh();
    };

    // run once on startup to populate the map
    load();

    // re-run load whenever git state changes (save, stage, commit, etc.)
    const watcher = repo.state.onDidChange(load);

    context.subscriptions.push(
        watcher,
        // open the native VS Code diff editor when a file is clicked in the tree
        vscode.commands.registerCommand('curator.openDiff', (fileUri: vscode.Uri) => {
            const original = toOriginalUri(fileUri);
            const filename = path.basename(fileUri.fsPath);
            vscode.commands.executeCommand('vscode.diff', original, fileUri, `${filename}  (HEAD ↔ Working)`);
        })
    );
}

export function deactivate(): void {}
