'use client';

import React, {
  createContext,
  FC,
  useCallback,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import clsx from 'clsx';
import useCookie from 'react-use-cookie';
import useSWR from 'swr';
import { orderBy } from 'lodash';
import { SVGLine } from '@gitroom/frontend/components/launches/launches.component';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import SafeImage from '@gitroom/react/helpers/safe.image';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useWaitForClass } from '@gitroom/helpers/utils/use.wait.for.class';
import { MultiMediaComponent } from '@gitroom/frontend/components/media/media.component';
import { Integration } from '@prisma/client';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useToaster } from '@gitroom/react/toaster/toaster';

const agentScopes = [
  'media:write',
  'templates:read',
  'templates:render',
  'posts:write',
  'posts:schedule',
  'posts:publish',
  'calendar:read',
  'calendar:write',
];

export const MediaPortal: FC<{
  media: { path: string; id: string }[];
  value: string;
  setMedia: (event: {
    target: {
      name: string;
      value?: {
        id: string;
        path: string;
        alt?: string;
        thumbnail?: string;
        thumbnailTimestamp?: number;
      }[];
    };
  }) => void;
}> = ({ media, setMedia, value }) => {
  const waitForClass = useWaitForClass('copilotKitMessages');
  const t = useT();
  if (!waitForClass) return null;
  return (
    <div className="pl-[14px] pr-[24px] whitespace-nowrap editor rm-bg">
      <MultiMediaComponent
        allData={[{ content: value }]}
        text={value}
        label={t('attachments', 'Attachments')}
        description=""
        value={media}
        dummy={false}
        name="image"
        onChange={setMedia}
        onOpen={() => {}}
        onClose={() => {}}
      />
    </div>
  );
};

export const AgentList: FC<{ onChange: (arr: any[]) => void }> = ({
  onChange,
}) => {
  const fetch = useFetch();
  const t = useT();
  const [selected, setSelected] = useState([]);

  const load = useCallback(async () => {
    return (await (await fetch('/integrations/list')).json()).integrations;
  }, []);

  const [collapseMenu, setCollapseMenu] = useCookie('collapseMenu', '0');

  const { data } = useSWR('integrations', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    fallbackData: [],
  });

  const setIntegration = useCallback(
    (integration: Integration) => () => {
      if (selected.some((p) => p.id === integration.id)) {
        onChange(selected.filter((p) => p.id !== integration.id));
        setSelected(selected.filter((p) => p.id !== integration.id));
      } else {
        onChange([...selected, integration]);
        setSelected([...selected, integration]);
      }
    },
    [selected]
  );

  const sortedIntegrations = useMemo(() => {
    return orderBy(
      data || [],
      ['type', 'disabled', 'identifier'],
      ['desc', 'asc', 'asc']
    );
  }, [data]);

  return (
    <div
      className={clsx(
        'trz bg-newBgColorInner flex flex-col gap-[15px] transition-all relative',
        collapseMenu === '1' ? 'group sidebar w-[100px]' : 'w-[260px]'
      )}
    >
      <div className="absolute top-0 start-0 w-full h-full p-[20px] overflow-auto scrollbar scrollbar-thumb-fifth scrollbar-track-newBgColor">
        <div className="flex items-center">
          <h2 className="group-[.sidebar]:hidden flex-1 text-[20px] font-[500] mb-[15px]">
            {t('select_channels', 'Select Channels')}
          </h2>
          <div
            onClick={() => setCollapseMenu(collapseMenu === '1' ? '0' : '1')}
            className="-mt-3 group-[.sidebar]:rotate-[180deg] group-[.sidebar]:mx-auto text-btnText bg-btnSimple rounded-[6px] w-[24px] h-[24px] flex items-center justify-center cursor-pointer select-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="13"
              viewBox="0 0 7 13"
              fill="none"
            >
              <path
                d="M6 11.5L1 6.5L6 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className={clsx('flex flex-col gap-[15px]')}>
          {sortedIntegrations.map((integration, index) => (
            <div
              onClick={setIntegration(integration)}
              key={integration.id}
              className={clsx(
                'flex gap-[12px] items-center group/profile justify-center hover:bg-boxHover rounded-e-[8px] hover:opacity-100 cursor-pointer',
                !selected.some((p) => p.id === integration.id) && 'opacity-20'
              )}
            >
              <div
                className={clsx(
                  'relative rounded-full flex justify-center items-center gap-[6px]',
                  integration.disabled && 'opacity-50'
                )}
              >
                {(integration.inBetweenSteps || integration.refreshNeeded) && (
                  <div className="absolute start-0 top-0 w-[39px] h-[46px] cursor-pointer">
                    <div className="bg-red-500 w-[15px] h-[15px] rounded-full start-0 -top-[5px] absolute z-[200] text-[10px] flex justify-center items-center">
                      !
                    </div>
                    <div className="bg-primary/60 w-[39px] h-[46px] start-0 top-0 absolute rounded-full z-[199]" />
                  </div>
                )}
                <div className="h-full w-[4px] -ms-[12px] rounded-s-[3px] opacity-0 group-hover/profile:opacity-100 transition-opacity">
                  <SVGLine />
                </div>
                <ImageWithFallback
                  fallbackSrc={`/icons/platforms/${integration.identifier}.png`}
                  src={integration.picture}
                  className="rounded-[8px]"
                  alt={integration.identifier}
                  width={36}
                  height={36}
                />
                <SafeImage
                  src={`/icons/platforms/${integration.identifier}.png`}
                  className="rounded-[8px] absolute z-10 bottom-[5px] -end-[5px] border border-fifth"
                  alt={integration.identifier}
                  width={18.41}
                  height={18.41}
                />
              </div>
              <div
                className={clsx(
                  'flex-1 whitespace-nowrap text-ellipsis overflow-hidden group-[.sidebar]:hidden',
                  integration.disabled && 'opacity-50'
                )}
              >
                {integration.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PropertiesContext = createContext({ properties: [] });
export const Agent: FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState([]);

  return (
    <PropertiesContext.Provider value={{ properties }}>
      <AgentList onChange={setProperties} />
      <div className="bg-newBgColorInner flex flex-1">{children}</div>
      <Threads />
    </PropertiesContext.Provider>
  );
};

const Threads: FC = () => {
  const fetch = useFetch();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const threads = useCallback(async () => {
    return (await fetch('/copilot/list')).json();
  }, []);
  const { id } = useParams<{ id: string }>();

  const { data } = useSWR('threads', threads);

  return (
    <div
      className={clsx(
        'trz bg-newBgColorInner flex flex-col gap-[15px] transition-all relative',
        'w-[260px]'
      )}
    >
      <div className="absolute top-0 start-0 w-full h-full p-[20px] overflow-auto scrollbar scrollbar-thumb-fifth scrollbar-track-newBgColor">
        <div className="mb-[15px] justify-center flex group-[.sidebar]:pb-[15px]">
          <Link
            href={`/agents`}
            className="text-white whitespace-nowrap flex-1 pt-[12px] pb-[14px] ps-[16px] pe-[20px] group-[.sidebar]:p-0 min-h-[44px] max-h-[44px] rounded-md bg-btnPrimary flex justify-center items-center gap-[5px] outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="21"
              height="20"
              viewBox="0 0 21 20"
              fill="none"
              className="min-w-[21px] min-h-[20px]"
            >
              <path
                d="M10.5001 4.16699V15.8337M4.66675 10.0003H16.3334"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex-1 text-start text-[16px] group-[.sidebar]:hidden">
              {t('start_a_new_chat', 'Start a new chat')}
            </div>
          </Link>
        </div>
        <ExternalAgentPanel />
        <div className="flex flex-col gap-[1px]">
          {data?.threads?.map((p: any) => (
            <Link
              className={clsx(
                'overflow-ellipsis overflow-hidden whitespace-nowrap hover:bg-newBgColor px-[10px] py-[6px] rounded-[10px] cursor-pointer',
                p.id === id && 'bg-newBgColor'
              )}
              href={`/agents/${p.id}`}
              key={p.id}
            >
              {p.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const ExternalAgentPanel: FC = () => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [draft, setDraft] = useState({
    id: '',
    name: 'Agent n8n',
    webhookUrl: '',
    accessMode: 'human_in_the_loop',
    enabled: true,
    scopes: ['posts:write', 'templates:read'],
  });

  const loadAgents = useCallback(async () => {
    return (await fetch('/agent-webhooks')).json();
  }, [fetch]);

  const { data, mutate } = useSWR('agent-webhooks', loadAgents, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  const saveAgent = useCallback(async () => {
    if (!draft.name.trim() || !draft.webhookUrl.trim()) {
      toaster.show('Nom et webhook sont requis', 'warning');
      return;
    }

    const response = await fetch(
      draft.id ? `/agent-webhooks/${draft.id}` : '/agent-webhooks',
      {
        method: draft.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: draft.name,
          webhookUrl: draft.webhookUrl,
          accessMode: draft.accessMode,
          enabled: draft.enabled,
          scopes: draft.scopes,
        }),
      }
    );
    const saved = await response.json();
    await mutate();
    setDraft((current) => ({
      ...current,
      id: saved.id,
    }));
    toaster.show(
      saved.secret
        ? `Agent enregistré. Secret: ${saved.secret}`
        : 'Agent enregistré',
      'success'
    );
  }, [draft, fetch, mutate, toaster]);

  const testAgent = useCallback(
    async (id: string) => {
      const response = await fetch(`/agent-webhooks/${id}/test`, {
        method: 'POST',
        body: JSON.stringify({
          payload: {
            source: 'AcadéPost',
            message: 'Test de webhook n8n',
          },
        }),
      });
      if (!response.ok) {
        toaster.show('Le test webhook a échoué', 'warning');
        return;
      }
      toaster.show('Webhook testé avec succès', 'success');
    },
    [fetch, toaster]
  );

  const deleteAgent = useCallback(
    async (id: string) => {
      await fetch(`/agent-webhooks/${id}`, { method: 'DELETE' });
      await mutate();
      toaster.show('Agent supprimé', 'success');
    },
    [fetch, mutate, toaster]
  );

  const toggleScope = useCallback((scope: string) => {
    setDraft((current) => ({
      ...current,
      scopes: current.scopes.includes(scope)
        ? current.scopes.filter((item) => item !== scope)
        : [...current.scopes, scope],
    }));
  }, []);

  return (
    <div className="acadepost-agent-panel mb-[18px]">
      <div className="mb-3">
        <div className="text-[13px] font-[800] text-textColor">
          Agents n8n
        </div>
        <div className="mt-1 text-[11px] leading-4 text-newTableText">
          {t(
            'n8n_agents_description',
            'Connectez un webhook externe pour créer des propositions à valider.'
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <input
          className="acadepost-agent-input"
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Nom"
        />
        <input
          className="acadepost-agent-input"
          value={draft.webhookUrl}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              webhookUrl: event.target.value,
            }))
          }
          placeholder="https://n8n.example/webhook/..."
        />
        <select
          className="acadepost-agent-input"
          value={draft.accessMode}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              accessMode: event.target.value,
              scopes:
                event.target.value === 'human_in_the_loop'
                  ? current.scopes.filter(
                      (scope) =>
                        scope !== 'posts:schedule' &&
                        scope !== 'posts:publish'
                    )
                  : current.scopes,
            }))
          }
        >
          <option value="human_in_the_loop">Human in the loop</option>
          <option value="full_access">Full Access</option>
        </select>
        <div className="grid grid-cols-2 gap-1">
          {agentScopes.map((scope) => {
            const disabled =
              draft.accessMode === 'human_in_the_loop' &&
              ['posts:schedule', 'posts:publish'].includes(scope);
            return (
              <button
                key={scope}
                disabled={disabled}
                onClick={() => toggleScope(scope)}
                className={clsx(
                  'acadepost-agent-scope',
                  draft.scopes.includes(scope) && 'is-active'
                )}
              >
                {scope}
              </button>
            );
          })}
        </div>
        <button className="acadepost-agent-button" onClick={saveAgent}>
          Enregistrer
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {data?.map((agent: any) => (
          <div key={agent.id} className="acadepost-agent-row">
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() =>
                setDraft({
                  id: agent.id,
                  name: agent.name,
                  webhookUrl: agent.webhookUrl,
                  accessMode: agent.accessMode,
                  enabled: agent.enabled,
                  scopes: agent.scopes || [],
                })
              }
            >
              <span className="block truncate text-[12px] font-[800]">
                {agent.name}
              </span>
              <span className="block truncate text-[10px] text-newTableText">
                {agent.accessMode === 'full_access'
                  ? 'Full Access'
                  : 'À valider'}
              </span>
            </button>
            <button onClick={() => testAgent(agent.id)}>Test</button>
            <button onClick={() => deleteAgent(agent.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};
