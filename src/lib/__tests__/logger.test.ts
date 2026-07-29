import { logger } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO] Test info message'));
  });

  it('should log warning messages', () => {
    logger.warn('Test warning');
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN] Test warning'));
  });

  it('should log error messages', () => {
    logger.error('Test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] Test error'),
      undefined
    );
  });

  it('should log API requests', () => {
    logger.logApiRequest('/api/test', 'POST', 'user123');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log database operations', () => {
    logger.logDatabaseOperation('SELECT', 'users');
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});

