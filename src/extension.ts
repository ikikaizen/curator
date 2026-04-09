import * as vscode from 'vscode';
import { getRepo, getChangedFiles, Change } from './git';

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

    // load all changed files into the map
    const load = () => {
        files.clear();
        for (const c of getChangedFiles(repo)) {
            files.set(c.uri.fsPath, c);
        }
        console.log('Curator files:', [...files.keys()]);
    };

    // run once on startup to populate the map
    load();

    // re-run load whenever git state changes (save, stage, commit, etc.)
    const watcher = repo.state.onDidChange(load);

    // push to subscriptions so the listener is cleaned up on deactivate
    context.subscriptions.push(watcher);
}

export function deactivate(): void {}
