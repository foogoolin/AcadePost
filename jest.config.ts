import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/apps', '<rootDir>/libraries'],
  testEnvironment: 'node',
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
