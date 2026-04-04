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
exports.pickAndShowDiff = pickAndShowDiff;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const git_1 = require("./git");
/**
 * Show a quick-pick dropdown listing all files with uncommitted changes.
 * User can select a file to view its diff.
 * Pre-selects the active file if it has changes.
 */
async function pickAndShowDiff(showDiff) {
    const git = (0, git_1.getGitAPI)();
    if (!git) {
        vscode.window.showErrorMessage('this: Git extension is not available.');
        return;
    }
    const activeUri = vscode.window.activeTextEditor?.document.uri;
    // Build list of all changed files across all repos
    const items = git.repositories.flatMap((repo) => (0, git_1.deduplicateFiles)([...repo.state.workingTreeChanges, ...repo.state.indexChanges])
        .map(c => {
        const rel = (0, git_1.repoRelPath)(repo, c.uri);
        const isActive = c.uri.fsPath === activeUri?.fsPath;
        return {
            label: `$(diff) ${path.basename(c.uri.fsPath)}${isActive ? '  $(circle-filled)' : ''}`,
            description: path.dirname(rel) === '.' ? '' : path.dirname(rel),
            detail: c.uri.fsPath,
            uri: c.uri,
        };
    }));
    if (items.length === 0) {
        vscode.window.showInformationMessage('this: No uncommitted changes.');
        return;
    }
    if (items.length === 1) {
        await showDiff(items[0].uri);
        return;
    }
    const picker = vscode.window.createQuickPick();
    picker.items = items;
    picker.placeholder = 'Select a changed file to diff';
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    const active = items.find(i => i.uri.fsPath === activeUri?.fsPath);
    if (active) {
        picker.activeItems = [active];
    }
    picker.onDidAccept(async () => {
        const [picked] = picker.selectedItems;
        picker.dispose();
        if (picked) {
            await showDiff(picked.uri);
        }
    });
    picker.onDidHide(() => picker.dispose());
    picker.show();
}
//# sourceMappingURL=picker.js.map