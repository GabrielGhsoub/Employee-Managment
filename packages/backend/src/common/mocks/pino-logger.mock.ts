// src/common/mocks/pino-logger.mock.ts

export const getPinoLoggerMock = () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
});