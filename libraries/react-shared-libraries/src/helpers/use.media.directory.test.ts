import { resolveMediaPath } from './media.directory';

describe('resolveMediaPath', () => {
  it('uses the current app upload route for local upload URLs saved with another host', () => {
    expect(
      resolveMediaPath('https://old.example/uploads/2026/05/image.png')
    ).toBe('/uploads/2026/05/image.png');
  });

  it('prefixes stored relative upload paths with the configured upload directory', () => {
    expect(resolveMediaPath('/2026/05/image.png')).toBe(
      '/uploads/2026/05/image.png'
    );
  });

  it('normalizes API upload URLs to the public upload route', () => {
    expect(
      resolveMediaPath('https://old.example/api/uploads/2026/05/image.png')
    ).toBe('/uploads/2026/05/image.png');
  });

  it('normalizes stored API upload paths to the public upload route', () => {
    expect(resolveMediaPath('/api/uploads/2026/05/image.png')).toBe(
      '/uploads/2026/05/image.png'
    );
  });

  it('keeps non-local public media URLs unchanged', () => {
    expect(resolveMediaPath('https://cdn.example/media/image.png')).toBe(
      'https://cdn.example/media/image.png'
    );
  });
});
