"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHeadProvider = setupHeadProvider;
exports.createShowDiff = createShowDiff;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const git_1 = require("./git");
/**
 * Register a content provider that serves the saved (committed) version of files.
 * Allows the diff view's left pane to display saved code without writing temp files.
 */
function setupHeadProvider(context, savedContent, refreshLeft) {
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(constants_1.SCHEME, {
        onDidChange: refreshLeft.event,
        provideTextDocumentContent: uri => savedContent.get(uri.toString()) ?? '',
    }));
}
/**
 * Create the showDiff command handler.
 * Opens a split-pane diff comparing a file's saved (committed) vs current version.
 * Fetches saved content from git and displays it in the diff view.
 */
function createShowDiff(savedContent, activeFiles, refreshLeft, onDiffOpened) {
    return async function showDiff(fileUri) {
        const target = fileUri ?? vscode.window.activeTextEditor?.document.uri;
        if (!target || target.scheme !== 'file') {
            vscode.window.showWarningMessage('this: No active file to diff.');
            return;
        }
        const git = (0, git_1.getGitAPI)();
        if (!git) {
            vscode.window.showErrorMessage('this: Git extension is not available.');
            return;
        }
        const repo = git.getRepository(target);
        if (!repo) {
            vscode.window.showWarningMessage('this: File is not in a git repository.');
            return;
        }
        const rel = (0, git_1.repoRelPath)(repo, target);
        let savedFileContent = '';
        try {
            savedFileContent = await repo.show('HEAD', rel);
        }
        catch { /* new/untracked file */ }
        let title = `${path.basename(target.fsPath)}: Saved ↔ Current`;
        try {
            const rawDiff = await repo.diffWithHEAD(rel);
            const { added, removed } = (0, git_1.countLines)(rawDiff);
            title += `  (+${added} −${removed})`;
        }
        catch { /* ignore */ }
        const savedUri = vscode.Uri.from({ scheme: constants_1.SCHEME, authority: 'saved', path: target.path });
        savedContent.set(savedUri.toString(), savedFileContent);
        refreshLeft.fire(savedUri);
        activeFiles.set(target.fsPath, savedUri);
        await vscode.commands.executeCommand('vscode.diff', savedUri, target, title);
        onDiffOpened();
    };
}
//# sourceMappingURL=diff.js.map