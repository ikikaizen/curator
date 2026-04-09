import * as vscode from 'vscode';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

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
        HEAD?: { commit?: string };   // current HEAD commit hash, changes after each commit
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

// cache of repoRoot:filePath → HEAD content, invalidated when HEAD commit changes
const headCache = new Map<string, string>();

/**
 * Clears the HEAD content cache.
 * Call this after a commit so the left pane reflects the new HEAD.
 */
export function invalidateHeadCache(): void {
    headCache.clear();
}

/**
 * Get the content of a file at HEAD.
 * Results are cached per file until invalidateHeadCache() is called.
 * Uses async execFile so large files don't block the UI thread.
 * Returns empty string for new files that don't exist in HEAD yet.
 */
export async function getHeadContent(repoRoot: string, filePath: string): Promise<string> {
    const key = `${repoRoot}:${filePath}`;
    if (headCache.has(key)) { return headCache.get(key)!; }

    const relative = path.relative(repoRoot, filePath).split(path.sep).join('/');
    try {
        const { stdout } = await execFileAsync('git', ['show', `HEAD:${relative}`], { cwd: repoRoot, encoding: 'utf8' });
        headCache.set(key, stdout);
        return stdout;
    } catch {
        // new file that hasn't been committed yet — no HEAD version exists, so show an empty left pane
        console.warn(`Curator: no HEAD version for ${relative}`);
        return '';
    }
}
