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

const emptyDraft = {
  id: '',
  providerIdentifier: '',
  name: '',
  enabled: true,
  fields: {} as Record<string, string>,
};

export const ProviderCredentialsComponent: FC = () => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);

  const loadProviders = useCallback(async () => {
    return (await fetch('/provider-credentials/providers')).json();
  }, [fetch]);

  const loadCredentials = useCallback(async () => {
    return (await fetch('/provider-credentials')).json();
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

  const providers = (providerData?.providers || []) as CredentialProvider[];
  const credentialList = (credentials || []) as ProviderCredential[];
  const currentProvider = useMemo(
    () =>
      providers.find(
        (provider: CredentialProvider) =>
          provider.identifier === selectedProvider
      ) || providers[0],
    [providers, selectedProvider]
  );

  const groupedProviders = useMemo(() => {
    return providers.reduce(
      (all: Record<string, CredentialProvider[]>, provider: CredentialProvider) => ({
        ...all,
        [provider.group]: [...(all[provider.group] || []), provider],
      }),
      {}
    );
  }, [providers]);

  useEffect(() => {
    if (!selectedProvider && providers[0]?.identifier) {
      setSelectedProvider(providers[0].identifier);
    }
  }, [providers, selectedProvider]);

  useEffect(() => {
    if (!currentProvider) {
      return;
    }

    const fields: Record<string, string> = {};
    (currentProvider.fields as CredentialField[]).forEach((field) => {
      fields[field.key] = '';
    });

    setDraft(() => ({
      ...emptyDraft,
      providerIdentifier: currentProvider.identifier,
      name: `${currentProvider.name} AcadéPost`,
      fields,
    }));
  }, [currentProvider]);

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
      const response = await fetch(
        `/provider-credentials/${credential.id}/test`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) {
        toaster.show('Vérification impossible', 'warning');
        return;
      }
      await mutate();
      toaster.show('Champs requis validés', 'success');
    },
    [fetch, mutate, toaster]
  );

  const deleteCredential = useCallback(
    async (credential: ProviderCredential) => {
      await fetch(`/provider-credentials/${credential.id}`, {
        method: 'DELETE',
      });
      await mutate();
      setDraft(emptyDraft);
      toaster.show('Identifiant supprimé', 'success');
    },
    [fetch, mutate, toaster]
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
          {Object.entries(groupedProviders).map(([group, groupProviders]) => (
            <div key={group} className="mb-4">
              <div className="acadepost-credentials-group">{group}</div>
              <div className="flex flex-col gap-2">
                {(groupProviders as CredentialProvider[]).map((provider) => (
                  <button
                    key={provider.identifier}
                    className={clsx(
                      'acadepost-credentials-provider',
                      provider.identifier === currentProvider.identifier &&
                        'is-active'
                    )}
                    onClick={() => setSelectedProvider(provider.identifier)}
                  >
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
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className="acadepost-credentials-card editor">
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
              className="acadepost-credentials-button"
              disabled={isSaving || !providerData?.credentialsEnabled}
              onClick={saveCredential}
            >
              {draft.id ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            {draft.id && (
              <button
                className="acadepost-credentials-button secondary"
                onClick={() => setDraft(emptyDraft)}
              >
                Nouveau
              </button>
            )}
          </div>

          {!!currentProvider.notes?.length && (
            <div className="acadepost-credentials-notes">
              {currentProvider.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
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
            ['Deauthorize callback', currentProvider.setup.deauthorizeCallbackUrl],
            ['Data deletion callback', currentProvider.setup.dataDeletionRequestUrl],
          ].map(([label, value]) => (
            <button
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
                <button onClick={() => editCredential(credential)}>
                  Modifier
                </button>
                <button onClick={() => testCredential(credential)}>
                  Tester
                </button>
                <button onClick={() => deleteCredential(credential)}>
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
