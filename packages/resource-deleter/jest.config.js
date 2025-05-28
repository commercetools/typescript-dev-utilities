/**
 * @type {import('@jest/types').Config.ProjectConfig}
 */
module.exports = {
  preset: 'ts-jest',
  testTimeout: 15000,
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '\\.(test|spec)\\.[t]s?$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  watchPlugins: ['jest-watch-typeahead/filename'],
  reporters: [
    'default',
    process.env.CI === 'true'
      ? [
          'jest-junit',
          { outputName: 'results.xml', outputDirectory: 'test-results' },
        ]
      : null,
  ].filter(Boolean),
  // setupFiles: ['<rootDir>/.jest/setEnvVars.js'],
};
