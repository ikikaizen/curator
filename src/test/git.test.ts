// mock child_process before any imports so execFileAsync is built from the mock
jest.mock('child_process', () => ({ execFile: jest.fn() }));

import { execFile } from 'child_process';
import { getChangedFiles, getHeadContent, invalidateHeadCache, ChangeStatus, Repository } from '../git';

const mockExecFile = execFile as unknown as jest.Mock;

// helper to build a minimal fake repo
function makeRepo(
    workingTreeChanges: Repository['state']['workingTreeChanges'] = [],
    indexChanges: Repository['state']['indexChanges'] = [],
): Repository {
    return {
        rootUri: { fsPath: '/repo', scheme: 'file' } as any,
        state: { workingTreeChanges, indexChanges, onDidChange: jest.fn() as any },
    };
}

// ─── getChangedFiles ──────────────────────────────────────────────────────────

describe('getChangedFiles', () => {
    it('combines workingTreeChanges and indexChanges', () => {
        const a = { uri: { fsPath: '/repo/a.ts' } as any, status: ChangeStatus.Modified };
        const b = { uri: { fsPath: '/repo/b.ts' } as any, status: ChangeStatus.IndexAdded };
        const result = getChangedFiles(makeRepo([a], [b]));
        expect(result).toEqual([a, b]);
    });

    it('returns empty array when there are no changes', () => {
        expect(getChangedFiles(makeRepo())).toHaveLength(0);
    });

    it('returns only working tree changes when index is empty', () => {
        const a = { uri: { fsPath: '/repo/a.ts' } as any, status: ChangeStatus.Modified };
        expect(getChangedFiles(makeRepo([a]))).toEqual([a]);
    });
});

// ─── getHeadContent + cache ───────────────────────────────────────────────────

describe('getHeadContent', () => {
    beforeEach(() => {
        invalidateHeadCache();
        mockExecFile.mockReset();
    });

    it('returns git file content', async () => {
        mockExecFile.mockImplementation((_f: any, _a: any, _o: any, cb: Function) =>
            cb(null, { stdout: 'const x = 1;\n' })
        );
        const result = await getHeadContent('/repo', '/repo/src/file.ts');
        expect(result).toBe('const x = 1;\n');
    });

    it('caches the result so git is only called once for the same file', async () => {
        mockExecFile.mockImplementation((_f: any, _a: any, _o: any, cb: Function) =>
            cb(null, { stdout: 'cached content' })
        );
        await getHeadContent('/repo', '/repo/src/file.ts');
        await getHeadContent('/repo', '/repo/src/file.ts');
        expect(mockExecFile).toHaveBeenCalledTimes(1);
    });

    it('re-fetches after invalidateHeadCache', async () => {
        mockExecFile.mockImplementation((_f: any, _a: any, _o: any, cb: Function) =>
            cb(null, { stdout: 'content' })
        );
        await getHeadContent('/repo', '/repo/src/file.ts');
        invalidateHeadCache();
        await getHeadContent('/repo', '/repo/src/file.ts');
        expect(mockExecFile).toHaveBeenCalledTimes(2);
    });

    it('returns empty string for new files not yet in HEAD', async () => {
        mockExecFile.mockImplementation((_f: any, _a: any, _o: any, cb: Function) =>
            cb(new Error('fatal: path not in HEAD'))
        );
        const result = await getHeadContent('/repo', '/repo/src/new-file.ts');
        expect(result).toBe('');
    });

    it('caches separate results for different files', async () => {
        mockExecFile.mockImplementation((_f: any, args: string[], _o: any, cb: Function) => {
            cb(null, { stdout: args[1] }); // echo back the path as content
        });
        const a = await getHeadContent('/repo', '/repo/a.ts');
        const b = await getHeadContent('/repo', '/repo/b.ts');
        expect(a).not.toBe(b);
        expect(mockExecFile).toHaveBeenCalledTimes(2);
    });
});
