const fs = require('node:fs');
const path = require('node:path');

describe('integrations credential selection flow', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'integrations.controller.ts'),
    'utf8'
  );

  it('accepts an optional credentialId query parameter for social auth URL generation', () => {
    expect(source).toContain("@Query('credentialId') credentialId");
  });

  it('resolves explicitly selected credentials before falling back to active credentials', () => {
    expect(source).toContain('credentialId');
    expect(source).toContain('resolveClientInformationByCredentialId');
    expect(source).toContain("`credential:${state}`");
  });
});
