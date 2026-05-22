export type ComposerProviderOptions = Record<string, unknown>;

export type ComposerOperationSource = 'default' | 'manual';

export type ComposerOperationSelection = {
  providerIdentifier: string;
  operationId: string;
  providerOptions: ComposerProviderOptions;
  source: ComposerOperationSource;
};

export type ComposerDestinationContract = ComposerOperationSelection & {
  destinationId: string;
};

export type ComposerOperationValue = {
  content?: string;
  media?: Array<{
    id?: string;
    path?: string;
    thumbnail?: string;
  }>;
};

export type ProviderOperationOption = {
  id: string;
  label: string;
  description: string;
  supports(values: ComposerOperationValue[]): boolean;
};

export const AUTO_OPERATION_ID = 'auto';

const mediaCount = (values: ComposerOperationValue[]) =>
  values.reduce((total, value) => total + (value.media?.length || 0), 0);

const textCount = (values: ComposerOperationValue[]) =>
  values.reduce((total, value) => total + (value.content?.trim().length || 0), 0);

const telegramOperations: ProviderOperationOption[] = [
  {
    id: 'telegram.message.send',
    label: 'Message',
    description: 'Texte sans média',
    supports: (values) => mediaCount(values) === 0 && textCount(values) > 0,
  },
  {
    id: 'telegram.photo.send',
    label: 'Photo',
    description: 'Un média visuel',
    supports: (values) => mediaCount(values) === 1,
  },
  {
    id: 'telegram.mediaGroup.send',
    label: 'Album',
    description: 'Plusieurs médias',
    supports: (values) => mediaCount(values) > 1,
  },
  {
    id: 'telegram.document.send',
    label: 'Document',
    description: 'Fichier ou média traité comme document',
    supports: (values) => mediaCount(values) >= 1,
  },
];

export const getProviderOperationOptions = (providerIdentifier: string) => {
  if (providerIdentifier === 'telegram') {
    return telegramOperations;
  }

  return [];
};

export const getDefaultOperationId = (
  providerIdentifier: string,
  values: ComposerOperationValue[] = []
) => {
  if (providerIdentifier !== 'telegram') {
    return AUTO_OPERATION_ID;
  }

  const count = mediaCount(values);

  if (count > 1) {
    return 'telegram.mediaGroup.send';
  }

  if (count === 1) {
    return 'telegram.photo.send';
  }

  return 'telegram.message.send';
};

export const resolveProviderOperationSelection = (
  providerIdentifier: string,
  stored: ComposerOperationSelection | undefined,
  values: ComposerOperationValue[] = []
): ComposerOperationSelection => {
  const options = getProviderOperationOptions(providerIdentifier);
  const defaultOperationId = getDefaultOperationId(providerIdentifier, values);
  const storedOperationIsAvailable =
    stored?.source !== 'default' &&
    options.some((option) => option.id === stored?.operationId);
  const operationId = storedOperationIsAvailable
    ? stored!.operationId
    : defaultOperationId;

  return {
    providerIdentifier,
    operationId,
    providerOptions: stored?.providerOptions || {},
    source: storedOperationIsAvailable ? 'manual' : 'default',
  };
};

export const getProviderOperationFromSettings = (
  settings: any,
  providerIdentifier: string
): ComposerOperationSelection | undefined => {
  const providerOperation = settings?.providerOperation;

  if (!providerOperation?.operationId) {
    return undefined;
  }

  return {
    providerIdentifier,
    operationId: providerOperation.operationId,
    providerOptions: providerOperation.providerOptions || {},
    source: providerOperation.operationSource || providerOperation.source || 'manual',
  };
};

export const buildComposerDestinationContract = (params: {
  destinationId: string;
  providerIdentifier: string;
  stored?: ComposerOperationSelection;
  values?: ComposerOperationValue[];
}): ComposerDestinationContract => {
  const resolved = resolveProviderOperationSelection(
    params.providerIdentifier,
    params.stored,
    params.values || []
  );

  return {
    destinationId: params.destinationId,
    ...resolved,
  };
};
