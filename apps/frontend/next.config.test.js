const fs = require('node:fs');
const path = require('node:path');

describe('frontend upload route configuration', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'next.config.js'),
    'utf8'
  );

  it('serves local uploads through a runtime route instead of a build-time storage gate', () => {
    expect(source).toContain("source: '/uploads/:path*'");
    expect(source).toContain("destination: '/api/uploads/:path*'");
    expect(source).not.toContain("process.env.STORAGE_PROVIDER === 'local'");
  });
});
