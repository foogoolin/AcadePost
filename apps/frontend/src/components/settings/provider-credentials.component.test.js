const fs = require('node:fs');
const path = require('node:path');

describe('provider credentials settings UI', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'provider-credentials.component.tsx'),
    'utf8'
  );

  it('keeps every button from accidentally submitting the parent settings form', () => {
    const buttonTags = Array.from(source.matchAll(/<button\b[^>]*>/g)).map(
      (match) => match[0]
    );

    expect(buttonTags.length).toBeGreaterThan(0);
    expect(buttonTags.filter((tag) => !/\btype=/.test(tag))).toEqual([]);
  });

  it('exposes a destination-based provider test post action', () => {
    expect(source).toContain('/integrations/list');
    expect(source).toContain('/test-post');
    expect(source).toContain('testPostIntegrationId');
    expect(source).toContain('testPostImageUrl');
    expect(source).toContain('testPostCredential');
    expect(source).toContain('Activez cet identifiant avant le test post');
    expect(source).toContain('!credential.enabled');
    expect(source).toContain('!draft.enabled');
    expect(source).toContain('<s>barré</s>');
    expect(source).toContain('Envoyer test post');
    expect(source).toContain('Test post');
  });
});
