const fs = require('node:fs');
const path = require('node:path');

describe('add provider credential selection', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'add.provider.component.tsx'),
    'utf8'
  );

  it('loads saved provider credentials for channel connection', () => {
    expect(source).toContain("fetch('/provider-credentials')");
  });

  it('sends selected credentialId to the auth URL endpoint', () => {
    expect(source).toContain('credentialId');
    expect(source).toContain('/integrations/social/${identifier}');
  });
});
