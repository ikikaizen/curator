import * as vscode from 'vscode';
import { getRefContent } from './git';

export class DiffProvider implements vscode.TextDocumentContentProvider {
    static readonly scheme = 'curator';

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChange = this._onDidChange.event;

    private ref: string = 'HEAD';

    constructor(private repoRoot: string) {}

    provideTextDocumentContent(uri: vscode.Uri): string {
        return getRefContent(this.repoRoot, this.ref, uri.path);
    }

    /**
     * Switch the ref used for the left pane (e.g. 'HEAD' or 'origin/main').
     * Fires onDidChange for every open virtual document so VS Code re-fetches content.
     */
    setRef(ref: string, openFiles: vscode.Uri[]): void {
        this.ref = ref;
        for (const fileUri of openFiles) {
            this._onDidChange.fire(toOriginalUri(fileUri));
        }
    }

    // call after a commit so the left pane reflects the new HEAD
    refresh(fileUri: vscode.Uri): void {
        this._onDidChange.fire(toOriginalUri(fileUri));
    }
}

export function toOriginalUri(fileUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.from({ scheme: DiffProvider.scheme, path: fileUri.fsPath });
}
