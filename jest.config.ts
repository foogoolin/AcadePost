import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/apps', '<rootDir>/libraries'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^@gitroom/backend/(.*)$': '<rootDir>/apps/backend/src/$1',
    '^@gitroom/frontend/(.*)$': '<rootDir>/apps/frontend/src/$1',
    '^@gitroom/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
    '^@gitroom/nestjs-libraries/(.*)$':
      '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@gitroom/react/(.*)$':
      '<rootDir>/libraries/react-shared-libraries/src/$1',
    '^@gitroom/plugins/(.*)$': '<rootDir>/libraries/plugins/src/$1',
    '^@gitroom/orchestrator/(.*)$': '<rootDir>/apps/orchestrator/src/$1',
    '^@gitroom/extension/(.*)$': '<rootDir>/apps/extension/src/$1',
  },
  testMatch: [
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/apps/.*/\\.next/',
    '<rootDir>/apps/.*/dist/',
    '<rootDir>/coverage/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/apps/.*/\\.next/',
    '<rootDir>/apps/.*/dist/',
    '<rootDir>/coverage/',
  ],
  passWithNoTests: true,
};

export default config;
