import * as childProcess from 'child_process';
import { getRefContent, getUpstreamRef, getRemoteChangedFiles, ChangeStatus } from '../git';

jest.mock('child_process');
const execFileSync = childProcess.execFileSync as jest.MockedFunction<typeof childProcess.execFileSync>;

const ROOT = '/repo';

describe('getRefContent', () => {
    it('returns file content at the given ref', () => {
        execFileSync.mockReturnValue('hello world\n' as any);
        expect(getRefContent(ROOT, 'HEAD', '/repo/src/foo.ts')).toBe('hello world\n');
        expect(execFileSync).toHaveBeenCalledWith(
            'git', ['show', 'HEAD:src/foo.ts'], { cwd: ROOT, encoding: 'utf8' }
        );
    });

    it('returns empty string when the file does not exist at that ref', () => {
        execFileSync.mockImplementation(() => { throw new Error('not found'); });
        expect(getRefContent(ROOT, 'HEAD', '/repo/src/new.ts')).toBe('');
    });

    it('uses the supplied ref, not always HEAD', () => {
        execFileSync.mockReturnValue('remote content' as any);
        getRefContent(ROOT, 'origin/main', '/repo/src/foo.ts');
        expect(execFileSync).toHaveBeenCalledWith(
            'git', ['show', 'origin/main:src/foo.ts'], { cwd: ROOT, encoding: 'utf8' }
        );
    });
});

describe('getUpstreamRef', () => {
    it('returns the tracking branch when one is configured', () => {
        execFileSync.mockReturnValue('origin/develop\n' as any);
        expect(getUpstreamRef(ROOT)).toBe('origin/develop');
    });

    it('falls back to origin/main when no upstream is set', () => {
        execFileSync.mockImplementation(() => { throw new Error('no upstream'); });
        expect(getUpstreamRef(ROOT)).toBe('origin/main');
    });
});

describe('getRemoteChangedFiles', () => {
    it('parses modified, added, and deleted entries', () => {
        execFileSync
            // first call: getUpstreamRef
            .mockReturnValueOnce('origin/main\n' as any)
            // second call: git diff --name-status
            .mockReturnValueOnce('M\tsrc/a.ts\nA\tsrc/b.ts\nD\tsrc/c.ts\n' as any);

        const changes = getRemoteChangedFiles(ROOT);

        expect(changes).toHaveLength(3);
        expect(changes[0]).toMatchObject({ status: ChangeStatus.Modified });
        expect(changes[0].uri.fsPath).toBe('/repo/src/a.ts');
        expect(changes[1]).toMatchObject({ status: ChangeStatus.IndexAdded });
        expect(changes[1].uri.fsPath).toBe('/repo/src/b.ts');
        expect(changes[2]).toMatchObject({ status: ChangeStatus.Deleted });
        expect(changes[2].uri.fsPath).toBe('/repo/src/c.ts');
    });

    it('parses rename entries using the destination path', () => {
        execFileSync
            .mockReturnValueOnce('origin/main\n' as any)
            .mockReturnValueOnce('R100\tsrc/old.ts\tsrc/new.ts\n' as any);

        const changes = getRemoteChangedFiles(ROOT);

        expect(changes).toHaveLength(1);
        expect(changes[0]).toMatchObject({ status: ChangeStatus.IndexRenamed });
        expect(changes[0].uri.fsPath).toBe('/repo/src/new.ts');
    });

    it('returns empty array when git diff fails', () => {
        execFileSync
            .mockReturnValueOnce('origin/main\n' as any)
            .mockImplementationOnce(() => { throw new Error('git error'); });

        expect(getRemoteChangedFiles(ROOT)).toEqual([]);
    });

    it('returns empty array for empty diff output', () => {
        execFileSync
            .mockReturnValueOnce('origin/main\n' as any)
            .mockReturnValueOnce('' as any);

        expect(getRemoteChangedFiles(ROOT)).toEqual([]);
    });
});
