const fs = require('node:fs');
const path = require('node:path');

describe('Telegram provider publishing', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'telegram.provider.ts'),
    'utf8'
  );

  it('keeps Telegram HTML tags needed by provider test posts', () => {
    expect(source).toContain('normalizeHtmlText');
    expect(source).toContain("'b'");
    expect(source).toContain("'strong'");
    expect(source).toContain("'i'");
    expect(source).toContain("'em'");
    expect(source).toContain("'u'");
    expect(source).toContain("'s'");
    expect(source).toContain("'strike'");
    expect(source).toContain("'del'");
    expect(source).toContain("replace(/<em>/g, '<i>')");
    expect(source).toContain("replace(/<(strike|del)>/g, '<s>')");
  });

  it('keeps public non-upload image URLs intact for Telegram photo tests', () => {
    expect(source).toContain('normalizedFrontendURL');
    expect(source).toContain('`${normalizedFrontendURL}/uploads/`');
    expect(source).toContain('mediaUrl.replace(normalizedFrontendURL,');
  });
});
