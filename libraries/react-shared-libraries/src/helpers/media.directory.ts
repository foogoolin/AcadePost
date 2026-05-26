const DEFAULT_UPLOAD_DIRECTORY = '/uploads';
const DEFAULT_API_UPLOAD_DIRECTORY = '/api/uploads';

function normalizeUploadDirectory(uploadDirectory?: string) {
  const directory = uploadDirectory || DEFAULT_UPLOAD_DIRECTORY;
  const withLeadingSlash = directory.startsWith('/')
    ? directory
    : `/${directory}`;

  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function normalizeLocalUploadPath(pathname: string, uploadPath: string) {
  if (pathname === uploadPath || pathname.startsWith(`${uploadPath}/`)) {
    return pathname;
  }

  if (
    pathname === DEFAULT_API_UPLOAD_DIRECTORY ||
    pathname.startsWith(`${DEFAULT_API_UPLOAD_DIRECTORY}/`)
  ) {
    return `${uploadPath}${pathname.slice(
      DEFAULT_API_UPLOAD_DIRECTORY.length
    )}`;
  }

  return undefined;
}

export const resolveMediaPath = (
  path?: string,
  uploadDirectory = DEFAULT_UPLOAD_DIRECTORY
) => {
  if (!path) {
    return '';
  }

  if (/^(data|blob):/i.test(path)) {
    return path;
  }

  const uploadPath = normalizeUploadDirectory(uploadDirectory);

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      const localUploadPath = normalizeLocalUploadPath(
        url.pathname,
        uploadPath
      );
      if (localUploadPath) {
        return `${localUploadPath}${url.search}${url.hash}`;
      }
    } catch {
      return path;
    }

    return path;
  }

  const localUploadPath = normalizeLocalUploadPath(path, uploadPath);
  if (localUploadPath) {
    return localUploadPath;
  }

  if (path.startsWith('/')) {
    return `${uploadPath}${path}`;
  }

  return `${uploadPath}/${path}`;
};
