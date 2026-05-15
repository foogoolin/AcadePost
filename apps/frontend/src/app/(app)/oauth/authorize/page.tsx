'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';

export default function OAuthAuthorizePage() {
  const searchParams = useSearchParams();
  const fetch = useFetch();
  const [appInfo, setAppInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const clientId = searchParams.get('client_id');
  const responseType = searchParams.get('response_type');
  const state = searchParams.get('state');

  useEffect(() => {
    if (!clientId || !responseType) {
      setError('Paramètres OAuth requis manquants (client_id, response_type)');
      setLoading(false);
      return;
    }
    if (responseType !== 'code') {
      setError('Seul response_type=code est pris en charge');
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: responseType,
      ...(state ? { state } : {}),
    });

    fetch(`/oauth/authorize?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.statusCode && data.statusCode >= 400) {
          setError(data.message || 'Requête OAuth invalide');
        } else {
          setAppInfo(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de valider la requête OAuth');
        setLoading(false);
      });
  }, [clientId, responseType, state]);

  const handleAction = useCallback(
    async (action: 'approve' | 'deny') => {
      setSubmitting(true);
      try {
        const result = await (
          await fetch('/oauth/authorize', {
            method: 'POST',
            body: JSON.stringify({
              client_id: clientId,
              state,
              action,
            }),
          })
        ).json();

        if (result.redirect) {
          window.location.href = result.redirect;
        }
      } catch {
        setError("Impossible de traiter l'autorisation");
        setSubmitting(false);
      }
    },
    [clientId, state]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-white relative overflow-hidden bg-[#050505]">
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-[24px]">
            <Logo />
          </div>
          <div className="text-[16px] text-gray-400">Veuillez patienter...</div>
          <div className="mt-[32px] flex justify-center">
            <div className="w-[48px] h-[48px] border-[3px] border-acadeMint border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-white relative overflow-hidden bg-[#050505]">
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-[24px]">
            <Logo />
          </div>
          <div className="w-[80px] h-[80px] mx-auto mb-[24px] rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-[40px] h-[40px] text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-[28px] font-semibold mb-[12px]">
            Erreur d'autorisation
          </div>
          <div className="text-[16px] text-gray-400 max-w-[400px]">{error}</div>
        </div>
      </div>
    );
  }

  if (!appInfo) {
    return null;
  }

  return (
    <div className="flex flex-1 items-center justify-center text-white relative overflow-hidden bg-[#050505]">
      <div className="relative z-10 w-full max-w-[500px] mx-auto px-[20px]">
        <div className="flex justify-center mb-[32px]">
          <Logo />
        </div>

        <div className="bg-[#101010] border border-white/10 rounded-[12px] p-[32px] flex flex-col gap-[24px]">
          <div className="flex flex-col items-center gap-[16px]">
            {appInfo.app.picture?.path ? (
              <img
                src={appInfo.app.picture.path}
                alt={appInfo.app.name}
                className="w-[64px] h-[64px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[64px] h-[64px] rounded-full bg-[#2A2929] flex items-center justify-center text-[24px] text-gray-400">
                {appInfo.app.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <h2 className="text-[24px] font-semibold text-center">
              {appInfo.app.name}
            </h2>
            {appInfo.app.description && (
              <div className="text-gray-400 text-center text-[14px]">
                {appInfo.app.description}
              </div>
            )}
          </div>

          <div className="border-t border-[#2A2929] pt-[16px]">
            <div className="text-[14px] text-gray-400 mb-[12px]">
              Cette application demande l’accès à votre compte AcadéPost. Elle
              pourra :
            </div>
            <ul className="text-[14px] list-disc list-inside space-y-[4px]">
              <li>Accéder à vos intégrations et canaux</li>
              <li>Créer et planifier des publications en votre nom</li>
              <li>Lire les statistiques de vos publications</li>
            </ul>
          </div>

          <div className="flex gap-[12px]">
            <button
              onClick={() => handleAction('approve')}
              disabled={submitting}
              className="flex-1 bg-acadeMint hover:bg-[#3db9a7] disabled:opacity-50 text-black rounded-[8px] py-[10px] px-[16px] text-[14px] font-semibold transition-colors"
            >
              Autoriser
            </button>
            <button
              onClick={() => handleAction('deny')}
              disabled={submitting}
              className="flex-1 bg-[#2A2929] hover:bg-[#3A3939] disabled:opacity-50 text-white rounded-[8px] py-[10px] px-[16px] text-[14px] font-semibold transition-colors"
            >
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
