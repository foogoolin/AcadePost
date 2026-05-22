const fs = require('node:fs');
const path = require('node:path');

describe('provider logs service', () => {
  const serviceSource = fs.readFileSync(
    path.join(__dirname, 'provider.logs.service.ts'),
    'utf8'
  );
  const repositorySource = fs.readFileSync(
    path.join(__dirname, 'provider.logs.repository.ts'),
    'utf8'
  );

  it('exposes a connection log writer backed by the repository', () => {
    expect(serviceSource).toContain('recordConnectionLog(');
    expect(repositorySource).toContain('createConnectionLog(');
    expect(repositorySource).toContain('providerConnectionLog.create');
  });

  it('sanitizes connection log summaries before persistence', () => {
    expect(serviceSource).toContain(
      'requestSummary: sanitizeProviderLogValue(input.requestSummary)'
    );
    expect(serviceSource).toContain(
      'responseSummary: sanitizeProviderLogValue(input.responseSummary)'
    );
    expect(serviceSource).toContain('sanitizeProviderLogError(error)');
  });

  it('exposes scoped readers for publish attempts and connection logs', () => {
    expect(serviceSource).toContain('listConnectionLogs(');
    expect(serviceSource).toContain('listPublishAttempts(');
    expect(repositorySource).toContain('providerConnectionLog.findMany');
    expect(repositorySource).toContain('providerPublishAttempt.findMany');
    expect(repositorySource).toContain('organizationId: input.organizationId');
  });
});
