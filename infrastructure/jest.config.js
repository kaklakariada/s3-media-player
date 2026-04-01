module.exports = {
    "roots": [
      "<rootDir>/test"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
    collectCoverageFrom: ['lib/**/*.ts', 'bin/**/*.ts'],
    coverageReporters: ['lcov', 'text'],
    coverageDirectory: 'coverage',
  }
