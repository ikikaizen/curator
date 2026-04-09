import * as vscode from 'vscode';
import * as path from 'path';
import { Change, ChangeStatus } from './git';

export class ChangedFilesProvider implements vscode.TreeDataProvider<Change> {
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private files: Map<string, Change>) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(change: Change): vscode.TreeItem {
        const item = new vscode.TreeItem(
            path.basename(change.uri.fsPath),
            vscode.TreeItemCollapsibleState.None
        );
        item.resourceUri = change.uri;
        item.iconPath = iconForStatus(change.status);
        item.tooltip = change.uri.fsPath;
        item.command = {
            command: 'curator.openDiff',
            title: 'Open Diff',
            arguments: [change.uri],
        };
        return item;
    }

    getChildren(): Change[] {
        return [...this.files.values()];
    }
}

function iconForStatus(status: ChangeStatus): vscode.ThemeIcon {
    switch (status) {
        case ChangeStatus.Untracked:
        case ChangeStatus.IndexAdded:
        case ChangeStatus.IntentToAdd:
            return new vscode.ThemeIcon('diff-added', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));
        case ChangeStatus.Deleted:
        case ChangeStatus.IndexDeleted:
            return new vscode.ThemeIcon('diff-removed', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
        default:
            return new vscode.ThemeIcon('diff-modified', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
    }
}
