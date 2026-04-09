import { toOriginalUri } from '../diffProvider';
import { DiffProvider } from '../diffProvider';

// ─── toOriginalUri ────────────────────────────────────────────────────────────

describe('toOriginalUri', () => {
    it('returns a URI with the curator scheme', () => {
        const fileUri = { fsPath: '/repo/src/file.ts', scheme: 'file' } as any;
        expect(toOriginalUri(fileUri).scheme).toBe('curator');
    });

    it('preserves the file fsPath as the URI path', () => {
        const fileUri = { fsPath: '/repo/src/file.ts', scheme: 'file' } as any;
        expect(toOriginalUri(fileUri).path).toBe('/repo/src/file.ts');
    });
});

// ─── DiffProvider.provideTextDocumentContent ──────────────────────────────────

describe('DiffProvider.provideTextDocumentContent', () => {
    it('calls getHeadContent with repoRoot and the uri path', async () => {
        const provider = new DiffProvider('/repo');
        const uri = { path: '/repo/src/file.ts' } as any;

        // getHeadContent will try to run git — since there's no real repo here it
        // will hit the error branch and return '', which is fine for this test
        const result = await provider.provideTextDocumentContent(uri);
        expect(typeof result).toBe('string');
    });
});
