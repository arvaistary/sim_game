export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(phaser)/)'
  ],
  collectCoverageFrom: [
    'src/ecs/**/*.js',
    '!src/ecs/**/*.test.js',
    '!src/ecs/**/*.spec.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/test/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  verbose: true,
};
