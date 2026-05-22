const fs = require('node:fs');
const path = require('node:path');

describe('provider logs UI', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'provider-logs.component.tsx'),
    'utf8'
  );

  it('loads both pipeline log streams from the backend', () => {
    expect(source).toContain('/provider-logs/publish-attempts?');
    expect(source).toContain('/provider-logs/connection?');
    expect(source).toContain('Provider Publish Attempt Log');
    expect(source).toContain('Provider Connection Log');
  });

  it('uses theme-aware readable status and accent classes', () => {
    expect(source).toContain('acadepost-status-pill is-success');
    expect(source).toContain('acadepost-readable-accent');
    expect(source).not.toContain('acadepost-button-primary text-white');
  });

  it('keeps native tab buttons from submitting parent forms', () => {
    const buttonTags = Array.from(source.matchAll(/<button\b[^>]*>/g)).map(
      (match) => match[0]
    );

    expect(buttonTags.length).toBeGreaterThan(0);
    expect(buttonTags.filter((tag) => !/\btype=/.test(tag))).toEqual([]);
  });
});
