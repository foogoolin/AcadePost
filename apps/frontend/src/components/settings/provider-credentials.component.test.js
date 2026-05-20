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
});
