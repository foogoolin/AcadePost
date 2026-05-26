import { useCallback } from 'react';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { resolveMediaPath } from './media.directory';

export { resolveMediaPath } from './media.directory';

export const useMediaDirectory = () => {
  const { uploadDirectory } = useVariables();
  const set = useCallback(
    (path: string) => {
      return resolveMediaPath(path, uploadDirectory);
    },
    [uploadDirectory]
  );
  return {
    set,
  };
};
