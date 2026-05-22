export type ProviderOperationTextSupport =
  | 'required'
  | 'optional'
  | 'unsupported';

export type ProviderOperationMediaSupport = {
  min: number;
  max?: number;
  types?: readonly string[];
};

export type ProviderOperationMetadata<OperationId extends string = string> = {
  id: OperationId;
  provider: string;
  label: string;
  description: string;
  text: ProviderOperationTextSupport;
  media: ProviderOperationMediaSupport;
  default?: boolean;
};

export type ProviderOperationPostDetails = {
  message?: string | null;
  text?: string | null;
  media?: readonly {
    type?: string;
    media?: string;
    path?: string;
  }[];
  settings?: {
    operation?: unknown;
    operationId?: unknown;
    providerOperation?: unknown;
    providerOperationId?: unknown;
  } | null;
  operation?: unknown;
};

export function getExplicitProviderOperationId(
  details: Pick<ProviderOperationPostDetails, 'settings' | 'operation'>
) {
  const settings = details.settings || {};
  const providerOperation =
    typeof settings.providerOperation === 'object' &&
    settings.providerOperation !== null
      ? (settings.providerOperation as {
          operation?: unknown;
          operationId?: unknown;
        })
      : undefined;
  const operation =
    details.operation ||
    settings.operation ||
    settings.operationId ||
    providerOperation?.operationId ||
    providerOperation?.operation ||
    settings.providerOperation ||
    settings.providerOperationId;

  return typeof operation === 'string' && operation.trim()
    ? operation.trim()
    : undefined;
}

export function fallbackProviderOperationId(providerIdentifier: string) {
  return `${providerIdentifier || 'provider'}.publish`;
}
