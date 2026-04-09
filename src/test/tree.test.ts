import { ChangedFilesProvider } from '../tree';
import { ChangeStatus, Change } from '../git';
import * as path from 'path';

function makeChange(fsPath: string, status: ChangeStatus): Change {
    return { uri: { fsPath, scheme: 'file' } as any, status };
}

// ─── getChildren ─────────────────────────────────────────────────────────────

describe('ChangedFilesProvider.getChildren', () => {
    it('returns all values from the files map', () => {
        const a = makeChange('/repo/a.ts', ChangeStatus.Modified);
        const b = makeChange('/repo/b.ts', ChangeStatus.Untracked);
        const files = new Map([[a.uri.fsPath, a], [b.uri.fsPath, b]]);
        const provider = new ChangedFilesProvider(files);
        expect(provider.getChildren()).toEqual([a, b]);
    });

    it('returns empty array when there are no changed files', () => {
        const provider = new ChangedFilesProvider(new Map());
        expect(provider.getChildren()).toHaveLength(0);
    });
});

// ─── getTreeItem ──────────────────────────────────────────────────────────────

describe('ChangedFilesProvider.getTreeItem', () => {
    it('uses the basename as the label', () => {
        const change = makeChange('/repo/src/extension.ts', ChangeStatus.Modified);
        const provider = new ChangedFilesProvider(new Map());
        const item = provider.getTreeItem(change);
        expect(item.label).toBe('extension.ts');
    });

    it('sets the openDiff command with the file uri as argument', () => {
        const change = makeChange('/repo/src/file.ts', ChangeStatus.Modified);
        const provider = new ChangedFilesProvider(new Map());
        const item = provider.getTreeItem(change) as any;
        expect(item.command.command).toBe('curator.openDiff');
        expect(item.command.arguments[0]).toBe(change.uri);
    });

    it('uses diff-added icon for untracked files', () => {
        const change = makeChange('/repo/new.ts', ChangeStatus.Untracked);
        const provider = new ChangedFilesProvider(new Map());
        const item = provider.getTreeItem(change) as any;
        expect(item.iconPath.id).toBe('diff-added');
    });

    it('uses diff-removed icon for deleted files', () => {
        const change = makeChange('/repo/gone.ts', ChangeStatus.Deleted);
        const provider = new ChangedFilesProvider(new Map());
        const item = provider.getTreeItem(change) as any;
        expect(item.iconPath.id).toBe('diff-removed');
    });

    it('uses diff-modified icon for modified files', () => {
        const change = makeChange('/repo/edited.ts', ChangeStatus.Modified);
        const provider = new ChangedFilesProvider(new Map());
        const item = provider.getTreeItem(change) as any;
        expect(item.iconPath.id).toBe('diff-modified');
    });
});
