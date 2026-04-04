import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('curator.showDiff', () => {
            vscode.window.showInformationMessage('this. is alive!');
        }),
    );
}

export function deactivate(): void {}
