const fs = require('fs');
const path = require('path');

describe('new launch manage modal payload and publish actions', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'manage.modal.tsx'),
    'utf8'
  );

  it('does not send temporary client ids when creating new posts', () => {
    expect(source).toContain('persistedPostValueIds');
    expect(source).toContain('persistedPostValueIds.has(value.id)');
    expect(source).not.toContain('existingData?.integration && value.id');
  });

  it('renders post-now as one shared button instead of a button inside a card', () => {
    expect(source).toContain(
      'acadepost-button-secondary acadepost-button-standard post-now'
    );
    expect(source).not.toContain(
      '<div className="acadepost-button-secondary h-[44px] w-full post-now">'
    );
  });

  it('exposes a direct composer test-post action for the selected destination', () => {
    expect(source).toContain('testCurrentPost');
    expect(source).toContain('/test-post');
    expect(source).toContain('providerCredentialId');
    expect(source).toContain('mediaUrls');
    expect(source).toContain("t('test_post', 'Test post')");
    expect(source).toContain('choose_one_destination_before_test');
  });

  it('sends the selected composer destination through the provider credential test-post endpoint', () => {
    expect(source).toContain('const response = await fetch(');
    expect(source).toContain(
      '`/provider-credentials/${credentialId}/test-post`'
    );
    expect(source).toContain("method: 'POST'");
    expect(source).toContain('integrationId: target.integration.id');
    expect(source).toContain('message,');
    expect(source).toContain('mediaUrls,');
    expect(source).toContain('operationId: providerOperation.operationId');
    expect(source).toContain("details?.releaseURL");
    expect(source).toContain("'Test post publié'");
  });
});
