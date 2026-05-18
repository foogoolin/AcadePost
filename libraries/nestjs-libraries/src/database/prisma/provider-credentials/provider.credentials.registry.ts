import {
  ProviderCredentialIdentifier,
  PROVIDER_CREDENTIAL_IDENTIFIERS,
} from '@gitroom/nestjs-libraries/dtos/provider-credentials/provider.credentials.dto';

export type ProviderCredentialField = {
  key: string;
  label: string;
  type: 'text' | 'password';
  required?: boolean;
  env?: string;
  placeholder?: string;
};

export type ProviderCredentialDefinition = {
  identifier: ProviderCredentialIdentifier;
  name: string;
  group: string;
  fields: ProviderCredentialField[];
  notes?: string[];
};

const clientFields = (
  clientIdEnv: string,
  clientSecretEnv: string,
  clientIdLabel = 'Client ID',
  clientSecretLabel = 'Client Secret'
): ProviderCredentialField[] => [
  {
    key: 'clientId',
    label: clientIdLabel,
    type: 'text',
    required: true,
    env: clientIdEnv,
    placeholder: 'client-id',
  },
  {
    key: 'clientSecret',
    label: clientSecretLabel,
    type: 'password',
    required: true,
    env: clientSecretEnv,
    placeholder: 'client-secret',
  },
];

const serverRuntimeNote =
  "MVP: ce fournisseur utilise encore les variables serveur .env au runtime; l'identifiant UI ne remplace pas encore la configuration serveur.";

export const PROVIDER_CREDENTIAL_DEFINITIONS: ProviderCredentialDefinition[] = [
  {
    identifier: 'x',
    name: 'X',
    group: 'Core social',
    fields: [
      {
        key: 'clientId',
        label: 'API Key',
        type: 'text',
        required: true,
        env: 'X_API_KEY',
        placeholder: 'x-api-key',
      },
      {
        key: 'clientSecret',
        label: 'API Secret',
        type: 'password',
        required: true,
        env: 'X_API_SECRET',
        placeholder: 'x-api-secret',
      },
    ],
  },
  {
    identifier: 'telegram',
    name: 'Telegram',
    group: 'Core social',
    fields: [
      {
        key: 'botToken',
        label: 'Bot Token',
        type: 'password',
        required: true,
        env: 'TELEGRAM_TOKEN',
        placeholder: '1234567890:token',
      },
      {
        key: 'botName',
        label: 'Bot Name',
        type: 'text',
        required: false,
        env: 'TELEGRAM_BOT_NAME',
        placeholder: 'acadepost_bot',
      },
    ],
    notes: [
      'Publie via Telegram Bot API. Ajoutez le bot au groupe ou canal, puis utilisez la commande de connexion affichée par AcadéPost.',
    ],
  },
  {
    identifier: 'linkedin',
    name: 'LinkedIn',
    group: 'Core social',
    fields: clientFields('LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'),
  },
  {
    identifier: 'linkedin-page',
    name: 'LinkedIn Page',
    group: 'Core social',
    fields: clientFields('LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'),
  },
  {
    identifier: 'facebook',
    name: 'Meta Business - Facebook Pages',
    group: 'Meta',
    fields: clientFields(
      'FACEBOOK_APP_ID',
      'FACEBOOK_APP_SECRET',
      'App ID',
      'App Secret'
    ),
    notes: [
      'Identifiant séparé pour Facebook Pages. Vous pouvez réutiliser les mêmes valeurs qu’une app Meta, mais AcadéPost ne les partage pas automatiquement.',
    ],
  },
  {
    identifier: 'instagram',
    name: 'Instagram Business',
    group: 'Meta',
    fields: clientFields(
      'FACEBOOK_APP_ID',
      'FACEBOOK_APP_SECRET',
      'App ID',
      'App Secret'
    ),
    notes: [
      'Identifiant séparé pour Instagram Business. Nécessite un compte Instagram professionnel relié à une Page Facebook.',
    ],
  },
  {
    identifier: 'instagram-standalone',
    name: 'Instagram Standalone',
    group: 'Meta',
    fields: clientFields(
      'INSTAGRAM_APP_ID',
      'INSTAGRAM_APP_SECRET',
      'Instagram App ID',
      'Instagram App Secret'
    ),
  },
  {
    identifier: 'threads',
    name: 'Threads',
    group: 'Meta',
    fields: clientFields(
      'THREADS_APP_ID',
      'THREADS_APP_SECRET',
      'Threads App ID',
      'Threads App Secret'
    ),
    notes: [
      'Identifiant séparé pour Threads. Ne dépend pas automatiquement de l’identifiant Facebook ou Instagram.',
    ],
  },
  {
    identifier: 'youtube',
    name: 'YouTube',
    group: 'Google',
    fields: clientFields('YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'),
  },
  {
    identifier: 'gmb',
    name: 'Google Business Profile',
    group: 'Google',
    fields: clientFields('GOOGLE_GMB_CLIENT_ID', 'GOOGLE_GMB_CLIENT_SECRET'),
  },
  {
    identifier: 'tiktok',
    name: 'TikTok',
    group: 'Core social',
    fields: clientFields(
      'TIKTOK_CLIENT_ID',
      'TIKTOK_CLIENT_SECRET',
      'Client Key',
      'Client Secret'
    ),
  },
  {
    identifier: 'pinterest',
    name: 'Pinterest',
    group: 'Core social',
    fields: clientFields('PINTEREST_CLIENT_ID', 'PINTEREST_CLIENT_SECRET'),
  },
  {
    identifier: 'reddit',
    name: 'Reddit',
    group: 'Core social',
    fields: clientFields('REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'),
  },
  {
    identifier: 'discord',
    name: 'Discord',
    group: 'Community',
    fields: [
      ...clientFields('DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'),
      {
        key: 'botToken',
        label: 'Bot Token',
        type: 'password',
        required: true,
        env: 'DISCORD_BOT_TOKEN_ID',
        placeholder: 'bot-token',
      },
    ],
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'slack',
    name: 'Slack',
    group: 'Community',
    fields: clientFields(
      'SLACK_ID',
      'SLACK_SECRET',
      'Client ID',
      'Client Secret'
    ),
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'mastodon',
    name: 'Mastodon',
    group: 'Federated',
    fields: [
      {
        key: 'instanceUrl',
        label: 'Instance URL',
        type: 'text',
        required: true,
        env: 'MASTODON_URL',
        placeholder: 'https://mastodon.social',
      },
      ...clientFields('MASTODON_CLIENT_ID', 'MASTODON_CLIENT_SECRET'),
    ],
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'dribbble',
    name: 'Dribbble',
    group: 'Creative',
    fields: clientFields('DRIBBBLE_CLIENT_ID', 'DRIBBBLE_CLIENT_SECRET'),
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'kick',
    name: 'Kick',
    group: 'Community',
    fields: clientFields(
      'KICK_CLIENT_ID',
      'KICK_SECRET',
      'Client ID',
      'Secret'
    ),
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'twitch',
    name: 'Twitch',
    group: 'Community',
    fields: clientFields('TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'),
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'vk',
    name: 'VK',
    group: 'Regional',
    fields: [
      {
        key: 'clientId',
        label: 'App ID',
        type: 'text',
        required: true,
        env: 'VK_ID',
        placeholder: 'vk-app-id',
      },
    ],
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'wrapcast',
    name: 'Farcaster / Warpcast',
    group: 'Web3',
    fields: clientFields(
      'NEYNAR_CLIENT_ID',
      'NEYNAR_SECRET_KEY',
      'Neynar Client ID',
      'Neynar Secret Key'
    ),
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'mewe',
    name: 'MeWe',
    group: 'Community',
    fields: [
      {
        key: 'instanceUrl',
        label: 'Host',
        type: 'text',
        required: true,
        env: 'MEWE_HOST',
        placeholder: 'https://mewe.com',
      },
      ...clientFields('MEWE_APP_ID', 'MEWE_API_KEY', 'App ID', 'API Key'),
    ],
    notes: [serverRuntimeNote],
  },
  {
    identifier: 'whop',
    name: 'Whop',
    group: 'Commerce',
    fields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        env: 'WHOP_CLIENT_ID',
        placeholder: 'whop-client-id',
      },
    ],
    notes: [serverRuntimeNote],
  },
];

export const PROVIDER_CREDENTIAL_DEFINITION_MAP = new Map(
  PROVIDER_CREDENTIAL_DEFINITIONS.map((definition) => [
    definition.identifier,
    definition,
  ])
);

export const PROVIDER_CREDENTIAL_LOOKUP: Record<
  ProviderCredentialIdentifier,
  ProviderCredentialIdentifier[]
> = PROVIDER_CREDENTIAL_IDENTIFIERS.reduce((acc, identifier) => {
  acc[identifier] = [identifier];
  return acc;
}, {} as Record<ProviderCredentialIdentifier, ProviderCredentialIdentifier[]>);

PROVIDER_CREDENTIAL_LOOKUP.instagram = ['instagram'];
PROVIDER_CREDENTIAL_LOOKUP.facebook = ['facebook'];
