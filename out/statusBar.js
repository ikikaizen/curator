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
exports.setupStatusBar = setupStatusBar;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const git_1 = require("./git");
/**
 * Create and return the status bar update function.
 * Sets up a status bar item that shows the active file's name and change stats.
 * Only visible when the active file has uncommitted changes.
 */
function setupStatusBar(context, activeFiles) {
    const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    bar.command = constants_1.CMD_SHOW_DIFF;
    context.subscriptions.push(bar);
    /**
     * Update the status bar display based on active editor and git state.
     * Shows file name and diff stats (+N −N) if a diff is open for the active file.
     */
    async function update() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.scheme !== 'file') {
            bar.hide();
            return;
        }
        const git = (0, git_1.getGitAPI)();
        if (!git) {
            bar.hide();
            return;
        }
        const repo = git.getRepository(editor.document.uri);
        if (!repo) {
            bar.hide();
            return;
        }
        const changes = (0, git_1.deduplicateFiles)([...repo.state.workingTreeChanges, ...repo.state.indexChanges]);
        if (!changes.some(c => c.uri.fsPath === editor.document.uri.fsPath)) {
            bar.hide();
            return;
        }
        let suffix = '';
        if (activeFiles.has(editor.document.uri.fsPath)) {
            try {
                const rel = (0, git_1.repoRelPath)(repo, editor.document.uri);
                const rawDiff = await repo.diffWithHEAD(rel);
                const { added, removed } = (0, git_1.countLines)(rawDiff);
                suffix = `  +${added} −${removed}`;
            }
            catch { /* ignore */ }
        }
        const name = path.basename(editor.document.uri.fsPath);
        const extra = changes.length > 1 ? `  |  ${changes.length - 1} other file${changes.length > 2 ? 's' : ''} changed` : '';
        bar.text = `$(diff) ${name}${suffix}`;
        bar.tooltip = `Show diff for ${name}${extra}`;
        bar.show();
    }
    return update;
}
//# sourceMappingURL=statusBar.js.map