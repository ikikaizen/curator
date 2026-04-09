// Minimal mock of the vscode module so unit tests can run outside VS Code.
// Only stubs the parts our code actually uses — add more as needed.

const vscode = {
    Uri: {
        from: (c: { scheme: string; path: string }) => ({
            scheme: c.scheme,
            path: c.path,
            fsPath: c.path,
        }),
    },
    ThemeIcon: class {
        constructor(public id: string, public color?: unknown) {}
    },
    ThemeColor: class {
        constructor(public id: string) {}
    },
    TreeItem: class {
        resourceUri?: unknown;
        iconPath?: unknown;
        tooltip?: string;
        command?: unknown;
        constructor(public label: string, public collapsibleState?: number) {}
    },
    TreeItemCollapsibleState: { None: 0 },
    EventEmitter: class {
        event = jest.fn();
        fire  = jest.fn();
        dispose = jest.fn();
    },
    window: {
        showErrorMessage: jest.fn(),
    },
    extensions: {
        getExtension: jest.fn(),
    },
};

export = vscode;
