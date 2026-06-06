/**
 * Jest Configuration for ZenStudy AI
 * @see https://jestjs.io/docs/configuration
 */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.js'],
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'text-summary'],
    coverageThreshold: {
        global: {
            branches: 5,
            functions: 5,
            lines: 5,
            statements: 5
        }
    }
};
