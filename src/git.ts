import * as vscode from 'vscode';
import * as path from 'path';
import { execFileSync } from 'child_process';

// ─── Types ────────────────────────────────────────────────────────────────────
// Minimal subset of the official git extension API types.
// Full version: https://raw.githubusercontent.com/microsoft/vscode/main/extensions/git/src/api/git.d.ts

interface GitExtension {
    getAPI(version: 1): GitAPI;
}

interface GitAPI {
    getRepository(uri: vscode.Uri): Repository | null;
}

export interface Repository {
    rootUri: vscode.Uri;
    state: {
        workingTreeChanges: Change[]; // edited but not yet staged (not git add'd)
        indexChanges: Change[];       // staged and ready to commit (git add'd)
        onDidChange: vscode.Event<void>;
    };
}

export const enum ChangeStatus {
    IndexModified  = 0,
    IndexAdded     = 1,
    IndexDeleted   = 2,
    IndexRenamed   = 3,
    IndexCopied    = 4,
    Modified       = 5,
    Deleted        = 6,
    Untracked      = 7,
    Ignored        = 8,
    IntentToAdd    = 9,
}

export interface Change {
    uri: vscode.Uri;
    status: ChangeStatus;
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Get the VS Code built-in git API.
 * @returns The git API instance, or undefined if the git extension is not active.
 */
export function getGitAPI(): GitAPI | undefined {
    const ext = vscode.extensions.getExtension<GitExtension>('vscode.git');
    return ext?.isActive ? ext.exports.getAPI(1) : undefined;
}

/**
 * Get the git repository for the workspace.
 * @param workspaceUri - The root URI of the workspace folder.
 * @returns The Repository, or null if not a git repo.
 */
export function getRepo(workspaceUri: vscode.Uri): Repository | null {
    const git = getGitAPI();
    if (!git) {
        vscode.window.showErrorMessage('Curator: Git extension not available.');
        return null;
    }

    const repo = git.getRepository(workspaceUri);
    if (!repo) {
        vscode.window.showErrorMessage('Curator: Workspace is not a git repository.');
        return null;
    }

    return repo;
}

/**
 * Get all files that have uncommitted changes (staged + unstaged).
 * @param repo - The repository to query.
 * @returns Array of changes.
 */
export function getChangedFiles(repo: Repository): Change[] {
    return [...repo.state.workingTreeChanges, ...repo.state.indexChanges];
}

/**
 * Detect the upstream tracking branch for the current branch.
 * Falls back to 'origin/main' if no upstream is configured.
 */
export function getUpstreamRef(repoRoot: string): string {
    try {
        return execFileSync(
            'git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
            { cwd: repoRoot, encoding: 'utf8' }
        ).trim();
    } catch {
        return 'origin/main';
    }
}

/**
 * Get all files that differ between the upstream remote ref and the working tree.
 * This includes committed-but-not-pushed changes as well as staged/unstaged changes.
 */
export function getRemoteChangedFiles(repoRoot: string): Change[] {
    const upstream = getUpstreamRef(repoRoot);
    try {
        const output = execFileSync(
            'git', ['diff', '--name-status', upstream],
            { cwd: repoRoot, encoding: 'utf8' }
        );
        return parseNameStatus(output, repoRoot);
    } catch {
        return [];
    }
}

/**
 * Get the content of a file at the given git ref.
 * Returns empty string if the file doesn't exist at that ref (e.g. new file).
 */
export function getRefContent(repoRoot: string, ref: string, filePath: string): string {
    const relative = path.relative(repoRoot, filePath).split(path.sep).join('/');
    try {
        return execFileSync('git', ['show', `${ref}:${relative}`], { cwd: repoRoot, encoding: 'utf8' });
    } catch {
        console.warn(`Curator: no content for ${relative} at ${ref}`);
        return '';
    }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseNameStatus(output: string, repoRoot: string): Change[] {
    const changes: Change[] = [];
    for (const line of output.trim().split('\n')) {
        if (!line) { continue; }
        const parts = line.split('\t');
        // For renames/copies the format is "R100\told\tnew" — take the last part as the working path
        const filePath = parts[parts.length - 1];
        const statusChar = parts[0][0];
        changes.push({
            uri: vscode.Uri.file(path.join(repoRoot, filePath)),
            status: charToChangeStatus(statusChar),
        });
    }
    return changes;
}

function charToChangeStatus(char: string): ChangeStatus {
    switch (char) {
        case 'A': return ChangeStatus.IndexAdded;
        case 'D': return ChangeStatus.Deleted;
        case 'R': return ChangeStatus.IndexRenamed;
        case 'C': return ChangeStatus.IndexCopied;
        default:  return ChangeStatus.Modified;
    }
}
