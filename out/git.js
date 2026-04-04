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
exports.getGitAPI = getGitAPI;
exports.repoRelPath = repoRelPath;
exports.countLines = countLines;
exports.deduplicateFiles = deduplicateFiles;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Get the VS Code Git extension API instance.
 */
function getGitAPI() {
    const ext = vscode.extensions.getExtension('vscode.git');
    return ext?.isActive ? ext.exports.getAPI(1) : undefined;
}
/**
 * Compute the relative path from a git repository root to a file.
 * Used for git diff commands which expect paths relative to the repo root.
 */
function repoRelPath(repo, uri) {
    return path.relative(repo.rootUri.fsPath, uri.fsPath).replace(/\\/g, '/');
}
/**
 * Parse a unified diff and count added/removed lines.
 * Excludes diff headers (+++/---) from the count.
 */
function countLines(diff) {
    let added = 0, removed = 0;
    for (const line of diff.split('\n')) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
            added++;
        }
        else if (line.startsWith('-') && !line.startsWith('---')) {
            removed++;
        }
    }
    return { added, removed };
}
/**
 * Deduplicate changes by file path.
 * Git's working tree and index can both report the same file.
 */
function deduplicateFiles(changes) {
    const seen = new Set();
    return changes.filter(c => !seen.has(c.uri.fsPath) && seen.add(c.uri.fsPath));
}
//# sourceMappingURL=git.js.map