import {
  getExplicitProviderOperationId,
  type ProviderOperationMetadata,
} from '@gitroom/nestjs-libraries/integrations/provider.operations';

export const TELEGRAM_OPERATION_IDS = {
  MESSAGE_SEND: 'telegram.message.send',
  PHOTO_SEND: 'telegram.photo.send',
  MEDIA_GROUP_SEND: 'telegram.mediaGroup.send',
  DOCUMENT_SEND: 'telegram.document.send',
} as const;

export type TelegramOperationId =
  (typeof TELEGRAM_OPERATION_IDS)[keyof typeof TELEGRAM_OPERATION_IDS];

export type TelegramOperationMedia = {
  type?: string;
  media?: string;
  path?: string;
};

export type TelegramOperationSettings = {
  operation?: unknown;
  operationId?: unknown;
  providerOperation?: {
    operationId?: unknown;
    operation?: unknown;
  } | unknown;
  providerOperationId?: unknown;
};

export type ResolveTelegramOperationInput = {
  message?: string | null;
  text?: string | null;
  media?: readonly TelegramOperationMedia[] | null;
  settings?: TelegramOperationSettings | null;
  operation?: unknown;
};

export type ResolvedTelegramOperation = {
  id: TelegramOperationId;
  defaulted: boolean;
  metadata: ProviderOperationMetadata<TelegramOperationId>;
};

export const TELEGRAM_OPERATIONS = [
  {
    id: TELEGRAM_OPERATION_IDS.MESSAGE_SEND,
    provider: 'telegram',
    label: 'Send message',
    description: 'Send a text-only Telegram message with sendMessage.',
    text: 'required',
    media: { min: 0, max: 0 },
    default: true,
  },
  {
    id: TELEGRAM_OPERATION_IDS.PHOTO_SEND,
    provider: 'telegram',
    label: 'Send photo or video',
    description:
      'Send one visual media item with sendPhoto or sendVideo and an optional caption.',
    text: 'optional',
    media: { min: 1, max: 1, types: ['photo', 'video'] },
  },
  {
    id: TELEGRAM_OPERATION_IDS.MEDIA_GROUP_SEND,
    provider: 'telegram',
    label: 'Send media group',
    description:
      'Send two or more media items with sendMediaGroup and an optional first caption.',
    text: 'optional',
    media: { min: 2 },
  },
  {
    id: TELEGRAM_OPERATION_IDS.DOCUMENT_SEND,
    provider: 'telegram',
    label: 'Send document',
    description:
      'Send one file with sendDocument and an optional caption.',
    text: 'optional',
    media: { min: 1, max: 1, types: ['document', 'photo', 'video'] },
  },
] as const satisfies readonly ProviderOperationMetadata<TelegramOperationId>[];

const TELEGRAM_OPERATION_ID_SET = new Set<string>(
  TELEGRAM_OPERATIONS.map((operation) => operation.id)
);

const TELEGRAM_OPERATION_BY_ID = new Map<
  TelegramOperationId,
  ProviderOperationMetadata<TelegramOperationId>
>(
  TELEGRAM_OPERATIONS.map((operation) => [
    operation.id,
    operation,
  ] as const)
);

export function isTelegramOperationId(
  operation: unknown
): operation is TelegramOperationId {
  return (
    typeof operation === 'string' && TELEGRAM_OPERATION_ID_SET.has(operation)
  );
}

export function getTelegramOperationMetadata(
  operation: TelegramOperationId
): ProviderOperationMetadata<TelegramOperationId> {
  return TELEGRAM_OPERATION_BY_ID.get(operation)!;
}

export function getExplicitTelegramOperation(
  input: Pick<ResolveTelegramOperationInput, 'settings' | 'operation'>
): string | undefined {
  return getExplicitProviderOperationId(input);
}

export function defaultTelegramOperationForContent(
  input: ResolveTelegramOperationInput
): TelegramOperationId {
  const media = input.media || [];

  if (media.length === 0) {
    return TELEGRAM_OPERATION_IDS.MESSAGE_SEND;
  }

  if (media.length > 1) {
    return TELEGRAM_OPERATION_IDS.MEDIA_GROUP_SEND;
  }

  return isDocumentMedia(media[0])
    ? TELEGRAM_OPERATION_IDS.DOCUMENT_SEND
    : TELEGRAM_OPERATION_IDS.PHOTO_SEND;
}

export function resolveTelegramOperation(
  input: ResolveTelegramOperationInput
): ResolvedTelegramOperation {
  const explicitOperation = getExplicitTelegramOperation(input);
  const operation =
    explicitOperation || defaultTelegramOperationForContent(input);

  validateTelegramOperation(operation, input);

  return {
    id: operation,
    defaulted: !explicitOperation,
    metadata: getTelegramOperationMetadata(operation),
  };
}

export function validateTelegramOperation(
  operation: unknown,
  input: ResolveTelegramOperationInput
): asserts operation is TelegramOperationId {
  if (!isTelegramOperationId(operation)) {
    throw new Error(`Unsupported Telegram operation: ${String(operation)}`);
  }

  const media = input.media || [];
  const mediaCount = media.length;

  switch (operation) {
    case TELEGRAM_OPERATION_IDS.MESSAGE_SEND:
      if (mediaCount > 0) {
        throw new Error(
          `${operation} does not support media. Use ${TELEGRAM_OPERATION_IDS.PHOTO_SEND}, ${TELEGRAM_OPERATION_IDS.MEDIA_GROUP_SEND}, or ${TELEGRAM_OPERATION_IDS.DOCUMENT_SEND}.`
        );
      }

      if (!hasText(input)) {
        throw new Error(`${operation} requires message text.`);
      }
      return;

    case TELEGRAM_OPERATION_IDS.PHOTO_SEND:
      if (mediaCount !== 1) {
        throw new Error(`${operation} requires exactly one media item.`);
      }

      if (isDocumentMedia(media[0])) {
        throw new Error(
          `${operation} only supports photo or video media. Use ${TELEGRAM_OPERATION_IDS.DOCUMENT_SEND} for documents.`
        );
      }
      return;

    case TELEGRAM_OPERATION_IDS.DOCUMENT_SEND:
      if (mediaCount !== 1) {
        throw new Error(`${operation} requires exactly one media item.`);
      }
      return;

    case TELEGRAM_OPERATION_IDS.MEDIA_GROUP_SEND:
      if (mediaCount < 2) {
        throw new Error(`${operation} requires at least two media items.`);
      }
      return;
  }
}

function hasText(input: Pick<ResolveTelegramOperationInput, 'message' | 'text'>) {
  return stripHtml(input.message || input.text || '').trim().length > 0;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '');
}

function isDocumentMedia(media: TelegramOperationMedia | undefined) {
  const type = normalizeMediaType(media?.type);

  return type === 'document';
}

function normalizeMediaType(type: string | undefined) {
  if (type === 'image') {
    return 'photo';
  }

  return type;
}
