export const PROVIDER_LOG_REDACTION = '[REDACTED]';

export type SanitizedProviderLogValue =
  | null
  | boolean
  | number
  | string
  | SanitizedProviderLogValue[]
  | { [key: string]: SanitizedProviderLogValue };

export type ProviderLogSanitizerOptions = {
  maxDepth?: number;
  maxArrayLength?: number;
  maxStringLength?: number;
};

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_ARRAY_LENGTH = 50;
const DEFAULT_MAX_STRING_LENGTH = 2000;

const SAFE_REFERENCE_KEYS = new Set([
  'id',
  'internalid',
  'organizationid',
  'integrationid',
  'providercredentialid',
  'credentialid',
  'postid',
  'releaseid',
  'messageid',
  'operationid',
]);

const SENSITIVE_KEYS = new Set([
  'authorization',
  'proxyauthorization',
  'cookie',
  'setcookie',
  'xapikey',
  'apikey',
  'apitoken',
  'apisecret',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'bottoken',
  'clientsecret',
  'appsecret',
  'secret',
  'password',
  'passwd',
  'pwd',
  'privatekey',
  'webhooksecret',
  'signingsecret',
  'chatid',
  'channelid',
]);

const TELEGRAM_BOT_TOKEN_PATTERN =
  /\b(?:bot)?\d{6,}:[A-Za-z0-9_-]{20,}\b/g;
const AUTH_VALUE_PATTERN =
  /\b(Bearer|Basic|Bot)\s+([A-Za-z0-9._~+/=:-]{8,})\b/gi;
const SECRET_QUERY_PARAM_PATTERN =
  /([?&](?:access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|apikey|client[_-]?secret|clientsecret|app[_-]?secret|secret|token|bot[_-]?token|password|auth|authorization)=)([^&#\s]+)/gi;

export function sanitizeProviderLogValue(
  value: unknown,
  options: ProviderLogSanitizerOptions = {}
) {
  return sanitizeValue(value, undefined, normalizeOptions(options), 0, new WeakSet());
}

export function sanitizeProviderLogError(
  error: unknown,
  options: ProviderLogSanitizerOptions = {}
): SanitizedProviderLogValue {
  const sanitized = sanitizeProviderLogValue(error, options);
  if (sanitized === undefined) {
    return {
      message: 'Unknown provider error',
    };
  }

  if (typeof sanitized === 'string') {
    return {
      message: sanitized,
    };
  }

  return sanitized;
}

export function isSensitiveProviderLogKey(key: string) {
  const normalized = normalizeKey(key);
  if (SAFE_REFERENCE_KEYS.has(normalized)) {
    return false;
  }

  if (SENSITIVE_KEYS.has(normalized)) {
    return true;
  }

  return (
    normalized.endsWith('token') ||
    normalized.endsWith('secret') ||
    normalized.endsWith('password') ||
    normalized.includes('apikey') ||
    normalized.includes('authorization')
  );
}

function sanitizeValue(
  value: unknown,
  key: string | undefined,
  options: Required<ProviderLogSanitizerOptions>,
  depth: number,
  seen: WeakSet<object>
): SanitizedProviderLogValue | undefined {
  if (key && isSensitiveProviderLogKey(key)) {
    return PROVIDER_LOG_REDACTION;
  }

  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return value as null | boolean | number;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'string') {
    return sanitizeString(value, options.maxStringLength);
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isBinaryValue(value)) {
    return `[Binary ${binaryLength(value)} bytes]`;
  }

  if (value instanceof Error) {
    return sanitizeErrorValue(value, options, depth, seen);
  }

  if (depth >= options.maxDepth) {
    return '[Truncated]';
  }

  if (typeof value !== 'object') {
    return sanitizeString(String(value), options.maxStringLength);
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const next = value
      .slice(0, options.maxArrayLength)
      .map((item) => sanitizeValue(item, undefined, options, depth + 1, seen))
      .map((item) => (item === undefined ? null : item));
    if (value.length > options.maxArrayLength) {
      next.push(`[Truncated ${value.length - options.maxArrayLength} items]`);
    }
    return next;
  }

  const output: { [key: string]: SanitizedProviderLogValue } = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    const sanitized = sanitizeValue(
      entryValue,
      entryKey,
      options,
      depth + 1,
      seen
    );
    if (sanitized !== undefined) {
      output[entryKey] = sanitized;
    }
  }

  return output;
}

function sanitizeErrorValue(
  error: Error,
  options: Required<ProviderLogSanitizerOptions>,
  depth: number,
  seen: WeakSet<object>
) {
  const errorRecord = error as Error & {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    response?: unknown;
    cause?: unknown;
  };
  const summary: Record<string, unknown> = {
    name: error.name || 'Error',
    message: error.message || String(error),
  };

  for (const key of ['code', 'status', 'statusCode', 'response', 'cause']) {
    if (errorRecord[key as keyof typeof errorRecord] !== undefined) {
      summary[key] = errorRecord[key as keyof typeof errorRecord];
    }
  }

  return sanitizeValue(summary, undefined, options, depth + 1, seen);
}

function sanitizeString(value: string, maxStringLength: number) {
  const sanitized = value
    .replace(TELEGRAM_BOT_TOKEN_PATTERN, PROVIDER_LOG_REDACTION)
    .replace(
      AUTH_VALUE_PATTERN,
      (_match, scheme: string) => `${scheme} ${PROVIDER_LOG_REDACTION}`
    )
    .replace(
      SECRET_QUERY_PARAM_PATTERN,
      (_match, prefix: string) => `${prefix}${PROVIDER_LOG_REDACTION}`
    );

  if (sanitized.length <= maxStringLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxStringLength)}...[truncated]`;
}

function normalizeOptions(
  options: ProviderLogSanitizerOptions
): Required<ProviderLogSanitizerOptions> {
  return {
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
    maxArrayLength: options.maxArrayLength ?? DEFAULT_MAX_ARRAY_LENGTH,
    maxStringLength: options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH,
  };
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isBinaryValue(value: unknown) {
  return (
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function binaryLength(value: unknown) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return value.length;
  }
  if (value instanceof ArrayBuffer) {
    return value.byteLength;
  }
  if (ArrayBuffer.isView(value)) {
    return value.byteLength;
  }
  return 0;
}
