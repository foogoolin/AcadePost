const fs = require('node:fs');
const path = require('node:path');

describe('post activity provider publish logging', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'post.activity.ts'),
    'utf8'
  );

  it('records provider publish attempts around provider post and comment calls', () => {
    expect(source).toContain('ProviderLogsService');
    expect(source).toContain('createProviderPublishAttempt({');
    expect(source).toContain("action: 'publish'");
    expect(source).toContain("action: 'comment'");
    expect(source).toContain('completeProviderPublishAttempt(attempt?.id');
  });

  it('does not put provider access tokens into publish attempt summaries', () => {
    expect(source).toContain('messageLengths');
    expect(source).toContain('mediaCounts');
    expect(source).not.toContain('requestSummary: integration.token');
    expect(source).not.toContain('token: integration.token');
  });
});
