module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        // redirect vscode imports to our minimal mock so tests run outside VS Code
        '^vscode$': '<rootDir>/src/__mocks__/vscode.ts',
    },
    testMatch: ['**/src/test/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
    },
};
