// Minimal vscode stub for unit tests running outside VS Code.
export const Uri = {
    file: (p: string) => ({ fsPath: p, path: p, scheme: 'file', toString: () => `file://${p}` }),
    from: (parts: { scheme: string; path: string }) => ({
        fsPath: parts.path,
        path: parts.path,
        scheme: parts.scheme,
        toString: () => `${parts.scheme}://${parts.path}`,
    }),
};

export const extensions = { getExtension: () => undefined };
export const window = { showErrorMessage: () => undefined };
