import * as vscode from 'vscode';
import { getHeadContent } from './git';

export class DiffProvider implements vscode.TextDocumentContentProvider {
    static readonly scheme = 'curator';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChange = this._onDidChange.event;

    constructor(private repoRoot: string) {}

    provideTextDocumentContent(uri: vscode.Uri): string {
        return getHeadContent(this.repoRoot, uri.path);
    }

    // call after a commit so the left pane reflects the new HEAD
    refresh(fileUri: vscode.Uri): void {
        this._onDidChange.fire(toOriginalUri(fileUri));
    }
}

export function toOriginalUri(fileUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.from({ scheme: DiffProvider.scheme, path: fileUri.fsPath });
}
