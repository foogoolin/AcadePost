'use client';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';

type CredentialField = {
  key: string;
  label: string;
  type: 'text' | 'password';
  required?: boolean;
  placeholder?: string;
};

type CredentialProvider = {
  identifier: string;
  name: string;
  group: string;
  fields: CredentialField[];
  notes?: string[];
  setup: {
    appDomain: string;
    websiteUrl: string;
    apiBaseUrl: string;
    redirectUri: string;
    oauthRedirectUris: string[];
    deauthorizeCallbackUrl: string;
    dataDeletionRequestUrl: string;
    policyStatus: 'later';
  };
};

type ProviderCredential = {
  id: string;
  providerIdentifier: string;
  name: string;
  enabled: boolean;
  status: string;
  maskedData: Record<
    string,
    {
      label: string;
      type: 'text' | 'password';
      hasValue: boolean;
      masked: string;
    }
  >;
  lastUsedAt?: string;
  lastTestedAt?: string;
};

type IntegrationDestination = {
  id: string;
  name: string;
  identifier: string;
  display?: string;
  disabled: boolean;
  refreshNeeded: boolean;
  inBetweenSteps: boolean;
};

const emptyDraft = {
  id: '',
  providerIdentifier: '',
  name: '',
  enabled: true,
  fields: {} as Record<string, string>,
};

const defaultTestPostMessage =
  '<b>AcadéPost test</b>\n<i>italique</i> · <u>souligné</u> · <s>barré</s>';

const providerIconMap: Record<string, string> = {
  'instagram-standalone': 'instagram-standalone',
  'linkedin-page': 'linkedin-page',
  facebook: 'facebook',
  gmb: 'gmb',
  instagram: 'instagram',
  linkedin: 'linkedin',
  pinterest: 'pinterest',
  reddit: 'reddit',
  telegram: 'telegram',
  threads: 'threads',
  tiktok: 'tiktok',
  x: 'x',
  youtube: 'youtube',
};

const providerIcon = (identifier: string) => {
  const iconName = providerIconMap[identifier] || identifier;
  return `/icons/platforms/${iconName}.png`;
};

const createDraftForProvider = (provider: CredentialProvider) => {
  const fields: Record<string, string> = {};
  provider.fields.forEach((field) => {
    fields[field.key] = '';
  });

  return {
    ...emptyDraft,
    providerIdentifier: provider.identifier,
    name: `${provider.name} AcadéPost`,
    fields,
  };
};

export const ProviderCredentialsComponent: FC = () => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingPost, setIsTestingPost] = useState(false);
  const [testPostIntegrationId, setTestPostIntegrationId] = useState('');
  const [testPostMessage, setTestPostMessage] = useState(
    defaultTestPostMessage
  );
  const [testPostImageUrl, setTestPostImageUrl] = useState('');

  const loadProviders = useCallback(async () => {
    return (await fetch('/provider-credentials/providers')).json();
  }, [fetch]);

  const loadCredentials = useCallback(async () => {
    return (await fetch('/provider-credentials')).json();
  }, [fetch]);

  const loadIntegrations = useCallback(async () => {
    return (await fetch('/integrations/list')).json();
  }, [fetch]);

  const { data: providerData } = useSWR(
    'provider-credentials/providers',
    loadProviders,
    {
      fallbackData: { credentialsEnabled: false, providers: [] },
      revalidateOnFocus: false,
    }
  );
  const { data: credentials, mutate } = useSWR(
    'provider-credentials',
    loadCredentials,
    {
      fallbackData: [],
      revalidateOnFocus: false,
    }
  );
  const { data: integrationsData } = useSWR(
    'provider-credentials/integrations',
    loadIntegrations,
    {
      fallbackData: { integrations: [] },
      revalidateOnFocus: false,
    }
  );

  const providers = (providerData?.providers || []) as CredentialProvider[];
  const credentialList = (credentials || []) as ProviderCredential[];
  const integrationList = (integrationsData?.integrations ||
    []) as IntegrationDestination[];
  const currentProvider = useMemo(
    () =>
      providers.find(
        (provider: CredentialProvider) =>
          provider.identifier === selectedProvider
      ) || providers[0],
    [providers, selectedProvider]
  );
  const savedForCurrentProvider = useMemo(
    () =>
      credentialList.filter(
        (credential) =>
          credential.providerIdentifier === currentProvider?.identifier
      ),
    [credentialList, currentProvider?.identifier]
  );
  const destinationsForCurrentProvider = useMemo(
    () =>
      integrationList.filter(
        (integration) =>
          integration.identifier === currentProvider?.identifier &&
          !integration.disabled &&
          !integration.refreshNeeded &&
          !integration.inBetweenSteps
      ),
    [currentProvider?.identifier, integrationList]
  );

  const groupedProviders = useMemo(() => {
    const needle = providerSearch.trim().toLowerCase();
    const visibleProviders = needle
      ? providers.filter((provider) =>
          [provider.name, provider.identifier, provider.group]
            .join(' ')
            .toLowerCase()
            .includes(needle)
        )
      : providers;

    return visibleProviders.reduce(
      (
        all: Record<string, CredentialProvider[]>,
        provider: CredentialProvider
      ) => ({
        ...all,
        [provider.group]: [...(all[provider.group] || []), provider],
      }),
      {}
    );
  }, [providerSearch, providers]);

  useEffect(() => {
    if (!selectedProvider && providers[0]?.identifier) {
      setSelectedProvider(providers[0].identifier);
    }
  }, [providers, selectedProvider]);

  useEffect(() => {
    if (!currentProvider) {
      return;
    }

    setDraft((current) => {
      if (
        current.id &&
        current.providerIdentifier === currentProvider.identifier
      ) {
        return current;
      }

      return createDraftForProvider(currentProvider);
    });
  }, [currentProvider]);

  useEffect(() => {
    if (
      testPostIntegrationId &&
      destinationsForCurrentProvider.some(
        (destination) => destination.id === testPostIntegrationId
      )
    ) {
      return;
    }

    setTestPostIntegrationId(destinationsForCurrentProvider[0]?.id || '');
  }, [destinationsForCurrentProvider, testPostIntegrationId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setTestPostImageUrl(
      (current) => current || `${window.location.origin}/brand/acadepost-logo.png`
    );
  }, []);

  const editCredential = useCallback(
    (credential: ProviderCredential) => {
      const provider = providers.find(
        (item: CredentialProvider) =>
          item.identifier === credential.providerIdentifier
      );
      if (!provider) {
        return;
      }
      const fields: Record<string, string> = {};
      (provider.fields as CredentialField[]).forEach((field) => {
        fields[field.key] = '';
      });
      setSelectedProvider(provider.identifier);
      setDraft({
        id: credential.id,
        providerIdentifier: credential.providerIdentifier,
        name: credential.name,
        enabled: credential.enabled,
        fields,
      });
    },
    [providers]
  );

  const saveCredential = useCallback(async () => {
    if (!currentProvider) {
      return;
    }
    if (!draft.name.trim()) {
      toaster.show('Ajoutez un nom pour cet identifiant', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        draft.id
          ? `/provider-credentials/${draft.id}`
          : '/provider-credentials',
        {
          method: draft.id ? 'PUT' : 'POST',
          body: JSON.stringify({
            providerIdentifier: currentProvider.identifier,
            name: draft.name,
            enabled: draft.enabled,
            fields: draft.fields,
          }),
        }
      );
      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || 'Impossible d’enregistrer');
      }
      const saved = await response.json();
      await mutate();
      editCredential(saved);
      toaster.show('Identifiant enregistré', 'success');
    } catch (error: any) {
      toaster.show(error?.message || 'Impossible d’enregistrer', 'warning');
    } finally {
      setIsSaving(false);
    }
  }, [currentProvider, draft, editCredential, fetch, mutate, toaster]);

  const testCredential = useCallback(
    async (credential: ProviderCredential) => {
      try {
        const response = await fetch(
          `/provider-credentials/${credential.id}/test`,
          {
            method: 'POST',
          }
        );
        if (!response.ok) {
          const details = await response.text();
          toaster.show(details || 'Vérification impossible', 'warning');
          return false;
        }
        await mutate();
        toaster.show('Connexion vérifiée', 'success');
        return true;
      } catch (error: any) {
        toaster.show(error?.message || 'Vérification impossible', 'warning');
        return false;
      }
    },
    [fetch, mutate, toaster]
  );

  const testDraftCredential = useCallback(async () => {
    if (!draft.id) {
      return;
    }

    const credential = credentialList.find((item) => item.id === draft.id);
    if (!credential) {
      return;
    }

    setIsTesting(true);
    try {
      await testCredential(credential);
    } finally {
      setIsTesting(false);
    }
  }, [credentialList, draft.id, testCredential]);

  const testPostDraftCredential = useCallback(async () => {
    if (!draft.id) {
      return;
    }
    if (!testPostIntegrationId) {
      toaster.show('Choisissez une destination pour le test post', 'warning');
      return;
    }

    setIsTestingPost(true);
    try {
      const response = await fetch(`/provider-credentials/${draft.id}/test-post`, {
        method: 'POST',
        body: JSON.stringify({
          integrationId: testPostIntegrationId,
          message: testPostMessage,
          imageUrl: testPostImageUrl,
        }),
      });
      const responseText = await response.text();
      let details: any = {};
      try {
        details = responseText ? JSON.parse(responseText) : {};
      } catch {
        details = { message: responseText };
      }
      if (!response.ok) {
        toaster.show(
          details?.message || details?.error || 'Test post impossible',
          'warning'
        );
        return;
      }

      await mutate();
      toaster.show(
        details?.releaseURL
          ? `Test post publié: ${details.releaseURL}`
          : 'Test post publié',
        'success'
      );
    } catch (error: any) {
      toaster.show(error?.message || 'Test post impossible', 'warning');
    } finally {
      setIsTestingPost(false);
    }
  }, [
    draft.id,
    fetch,
    mutate,
    testPostIntegrationId,
    testPostImageUrl,
    testPostMessage,
    toaster,
  ]);

  const deleteCredential = useCallback(
    async (credential: ProviderCredential) => {
      await fetch(`/provider-credentials/${credential.id}`, {
        method: 'DELETE',
      });
      await mutate();
      setDraft(
        currentProvider ? createDraftForProvider(currentProvider) : emptyDraft
      );
      toaster.show('Identifiant supprimé', 'success');
    },
    [currentProvider, fetch, mutate, toaster]
  );

  const copyValue = useCallback(
    async (value: string) => {
      await navigator.clipboard?.writeText(value);
      toaster.show('Copié', 'success');
    },
    [toaster]
  );

  if (!currentProvider) {
    return (
      <div className="acadepost-credentials-shell p-5">
        Aucun fournisseur disponible.
      </div>
    );
  }

  return (
    <div className="acadepost-credentials-shell">
      <div className="acadepost-credentials-header">
        <div>
          <p className="acadepost-credentials-kicker">Plateformes</p>
          <h2>Identifiants</h2>
          <p>
            Configurez les clés API par projet. Les secrets restent masqués
            après l’enregistrement.
          </p>
        </div>
        {!providerData?.credentialsEnabled && (
          <div className="acadepost-credentials-warning">
            Ajoutez `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` dans l’environnement
            serveur avant d’enregistrer des secrets.
          </div>
        )}
      </div>

      <div className="acadepost-credentials-grid">
        <aside className="acadepost-credentials-card provider-list">
          <label className="acadepost-credentials-search">
            Rechercher
            <input
              value={providerSearch}
              onChange={(event) => setProviderSearch(event.target.value)}
              placeholder="Telegram, YouTube, Meta..."
            />
          </label>
          {Object.entries(groupedProviders).map(([group, groupProviders]) => (
            <div key={group} className="mb-4">
              <div className="acadepost-credentials-group">{group}</div>
              <div className="flex flex-col gap-2">
                {(groupProviders as CredentialProvider[]).map((provider) => (
                  <button
                    type="button"
                    key={provider.identifier}
                    className={clsx(
                      'acadepost-credentials-provider',
                      provider.identifier === currentProvider.identifier &&
                        'is-active'
                    )}
                    onClick={() => setSelectedProvider(provider.identifier)}
                  >
                    <img
                      className="acadepost-credentials-provider-icon"
                      src={providerIcon(provider.identifier)}
                      alt=""
                      aria-hidden="true"
                    />
                    <span className="acadepost-credentials-provider-copy">
                      <span>{provider.name}</span>
                      <small>
                        {
                          credentialList.filter(
                            (item: ProviderCredential) =>
                              item.providerIdentifier === provider.identifier
                          ).length
                        }{' '}
                        configuré
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!Object.keys(groupedProviders).length && (
            <div className="acadepost-credentials-empty">
              Aucune plateforme trouvée.
            </div>
          )}
        </aside>

        <main className="acadepost-credentials-card credentials-editor">
          <div className="acadepost-credentials-title-row">
            <div>
              <p className="acadepost-credentials-kicker">Configuration</p>
              <h3>{currentProvider.name}</h3>
            </div>
            <label className="acadepost-credentials-toggle">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    enabled: event.target.checked,
                  }))
                }
              />
              Actif
            </label>
          </div>

          <label className="acadepost-credentials-field">
            Nom interne
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={`${currentProvider.name} AcadéPost`}
            />
          </label>

          <div className="acadepost-credentials-fields">
            {currentProvider.fields.map((field) => (
              <label key={field.key} className="acadepost-credentials-field">
                {field.label}
                <input
                  type={field.type}
                  value={draft.fields[field.key] || ''}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fields: {
                        ...current.fields,
                        [field.key]: event.target.value,
                      },
                    }))
                  }
                  placeholder={
                    draft.id && field.type === 'password'
                      ? 'Laisser vide pour conserver la valeur'
                      : field.placeholder || field.label
                  }
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="acadepost-credentials-button"
              disabled={isSaving || !providerData?.credentialsEnabled}
              onClick={saveCredential}
            >
              {draft.id ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            {draft.id && (
              <button
                type="button"
                className="acadepost-credentials-button secondary"
                disabled={isTesting}
                onClick={testDraftCredential}
              >
                {isTesting ? 'Test en cours' : 'Tester la connexion'}
              </button>
            )}
            {draft.id && (
              <button
                type="button"
                className="acadepost-credentials-button secondary"
                onClick={() =>
                  setDraft(createDraftForProvider(currentProvider))
                }
              >
                Nouveau
              </button>
            )}
          </div>

          {draft.id && (
            <div className="acadepost-credentials-testpost">
              <div>
                <p className="acadepost-credentials-kicker">
                  Publication test
                </p>
                <strong>Tester le post provider</strong>
                <span>
                  Envoie un vrai post de test via cet identifiant vers une
                  destination connectée.
                </span>
              </div>
              <label className="acadepost-credentials-field">
                Destination
                <select
                  value={testPostIntegrationId}
                  onChange={(event) =>
                    setTestPostIntegrationId(event.target.value)
                  }
                  disabled={!destinationsForCurrentProvider.length}
                >
                  {destinationsForCurrentProvider.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.name}
                      {destination.display ? ` · ${destination.display}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="acadepost-credentials-field">
                Message HTML
                <textarea
                  value={testPostMessage}
                  onChange={(event) => setTestPostMessage(event.target.value)}
                  rows={3}
                />
              </label>
              <label className="acadepost-credentials-field">
                Image URL
                <input
                  value={testPostImageUrl}
                  onChange={(event) => setTestPostImageUrl(event.target.value)}
                  placeholder="https://..."
                />
              </label>
              <button
                type="button"
                className="acadepost-credentials-button"
                disabled={
                  isTestingPost || !destinationsForCurrentProvider.length
                }
                onClick={testPostDraftCredential}
              >
                {isTestingPost ? 'Publication en cours' : 'Envoyer test post'}
              </button>
              {!destinationsForCurrentProvider.length && (
                <div className="acadepost-credentials-muted">
                  Aucune destination active pour ce provider. Connectez un canal
                  avant de tester une publication.
                </div>
              )}
            </div>
          )}

          {!!currentProvider.notes?.length && (
            <div className="acadepost-credentials-notes">
              {currentProvider.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          )}

          {!!savedForCurrentProvider.length && (
            <div className="acadepost-credentials-notes">
              <strong>Identifiants enregistrés</strong>
              <div className="acadepost-credentials-inline-list">
                {savedForCurrentProvider.map((credential) => (
                  <button
                    type="button"
                    key={credential.id}
                    className={clsx(
                      'acadepost-credentials-inline-credential',
                      credential.id === draft.id && 'is-active'
                    )}
                    onClick={() => editCredential(credential)}
                  >
                    <span>{credential.name}</span>
                    <small>{credential.status}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        <aside className="acadepost-credentials-card setup">
          <p className="acadepost-credentials-kicker">URLs à déclarer</p>
          <h3>Setup app</h3>
          {[
            ['Domaine app', currentProvider.setup.appDomain],
            ['Site web', currentProvider.setup.websiteUrl],
            ['Redirect URI', currentProvider.setup.redirectUri],
            ['API base', currentProvider.setup.apiBaseUrl],
            [
              'Deauthorize callback',
              currentProvider.setup.deauthorizeCallbackUrl,
            ],
            [
              'Data deletion callback',
              currentProvider.setup.dataDeletionRequestUrl,
            ],
          ].map(([label, value]) => (
            <button
              type="button"
              key={label}
              className="acadepost-credentials-copy"
              onClick={() => copyValue(value)}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </button>
          ))}
          <div className="acadepost-credentials-muted">
            Les pages policy/legal seront ajoutées plus tard. Ici, on prépare
            seulement les URLs techniques attendues par les plateformes.
          </div>
        </aside>
      </div>

      <section className="acadepost-credentials-card saved">
        <div className="acadepost-credentials-title-row">
          <div>
            <p className="acadepost-credentials-kicker">Enregistrés</p>
            <h3>Identifiants du projet</h3>
          </div>
        </div>
        <div className="acadepost-credentials-table">
          {credentialList.map((credential: ProviderCredential) => (
            <div key={credential.id} className="acadepost-credentials-row">
              <div>
                <strong>{credential.name}</strong>
                <span>
                  {credential.providerIdentifier} · {credential.status}
                </span>
              </div>
              <div className="acadepost-credentials-secrets">
                {Object.entries(credential.maskedData || {}).map(
                  ([key, field]) => (
                    <span key={key}>{field.masked || field.label}</span>
                  )
                )}
              </div>
              <div className="acadepost-credentials-row-actions">
                <button type="button" onClick={() => editCredential(credential)}>
                  Modifier
                </button>
                <button type="button" onClick={() => testCredential(credential)}>
                  Tester
                </button>
                <button type="button" onClick={() => deleteCredential(credential)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          {!credentialList.length && (
            <div className="acadepost-credentials-empty">
              Aucun identifiant enregistré pour ce projet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
