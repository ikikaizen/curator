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
exports.setupTree = setupTree;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const git_1 = require("./git");
/**
 * Register the tree view data provider for the "Changed Files" sidebar.
 * Displays all files with uncommitted changes across all open repositories.
 */
function setupTree(context, refreshRight) {
    context.subscriptions.push(vscode.window.registerTreeDataProvider(constants_1.VIEW_ID, {
        onDidChangeTreeData: refreshRight.event,
        getTreeItem: (item) => item,
        getChildren() {
            const git = (0, git_1.getGitAPI)();
            if (!git) {
                return [];
            }
            return git.repositories.flatMap((repo) => (0, git_1.deduplicateFiles)([...repo.state.workingTreeChanges, ...repo.state.indexChanges])
                .map(c => makeTreeItem(c, repo.rootUri.fsPath)));
        },
    }));
}
/**
 * Create a tree item representing a changed file.
 * Sets up icon, description, tooltip, and click command.
 */
function makeTreeItem(change, repoRootFsPath) {
    const rel = path.relative(repoRootFsPath, change.uri.fsPath);
    const item = new vscode.TreeItem(path.basename(change.uri.fsPath), vscode.TreeItemCollapsibleState.None);
    item.resourceUri = change.uri;
    item.description = path.dirname(rel) === '.' ? '' : path.dirname(rel);
    item.tooltip = change.uri.fsPath;
    item.contextValue = 'changedFile';
    item.iconPath = new vscode.ThemeIcon(getStatusIcon(change.status), new vscode.ThemeColor(getStatusColor(change.status)));
    item.command = { command: constants_1.CMD_SHOW_DIFF, title: 'Show Diff', arguments: [change.uri] };
    return item;
}
/**
 * Get the VS Code icon name for a file status code.
 */
function getStatusIcon(code) {
    switch (code) {
        case 1 /* Status.INDEX_ADDED */:
        case 7 /* Status.UNTRACKED */:
        case 9 /* Status.INTENT_TO_ADD */: return 'diff-added';
        case 2 /* Status.INDEX_DELETED */:
        case 6 /* Status.DELETED */: return 'diff-removed';
        case 3 /* Status.INDEX_RENAMED */: return 'diff-renamed';
        default: return 'diff-modified';
    }
}
/**
 * Get the VS Code theme color name for a file status code.
 * Used to colorize the tree item icon.
 */
function getStatusColor(code) {
    switch (code) {
        case 1 /* Status.INDEX_ADDED */:
        case 7 /* Status.UNTRACKED */:
        case 9 /* Status.INTENT_TO_ADD */: return 'gitDecoration.untrackedResourceForeground';
        case 2 /* Status.INDEX_DELETED */:
        case 6 /* Status.DELETED */: return 'gitDecoration.deletedResourceForeground';
        case 3 /* Status.INDEX_RENAMED */: return 'gitDecoration.renamedResourceForeground';
        default: return 'gitDecoration.modifiedResourceForeground';
    }
}
//# sourceMappingURL=tree.js.map