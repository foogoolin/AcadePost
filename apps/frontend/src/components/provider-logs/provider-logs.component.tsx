'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import copy from 'copy-to-clipboard';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { Button } from '@gitroom/react/form/button';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import clsx from 'clsx';

type LogMode = 'publish' | 'connection';

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface ProviderCredentialRef {
  id: string;
  name: string;
  providerIdentifier: string;
  status: string;
  enabled: boolean;
}

interface IntegrationRef {
  id: string;
  name: string;
  providerIdentifier: string;
  profile: string;
  disabled: boolean;
}

interface PostRef {
  id: string;
  state: string;
  publishDate: string;
  releaseURL: string | null;
  error: string | null;
}

interface PublishAttemptRow {
  id: string;
  providerIdentifier: string;
  operationId: string;
  status: string;
  providerStatus: string | null;
  requestSummary: unknown;
  responseSummary: unknown;
  errorSummary: unknown;
  releaseId: string | null;
  releaseURL: string | null;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
  integration: IntegrationRef | null;
  providerCredential: ProviderCredentialRef | null;
  post: PostRef | null;
}

interface ConnectionLogRow {
  id: string;
  providerIdentifier: string;
  action: string;
  status: string;
  requestSummary: unknown;
  responseSummary: unknown;
  errorSummary: unknown;
  durationMs: number | null;
  createdAt: string;
  providerCredential: ProviderCredentialRef | null;
}

const statusTone = (status: string) => {
  const normalized = status.toLowerCase();
  if (['success', 'completed', 'published'].includes(normalized)) {
    return 'border-[#4cccb8]/40 bg-[#4cccb8]/10 text-[#4cccb8]';
  }
  if (['failure', 'failed', 'error'].includes(normalized)) {
    return 'border-[#fda100]/50 bg-[#fda100]/10 text-[#fda100]';
  }
  return 'border-newTableBorder bg-newBgColorInner text-textColor';
};

const displayJson = (value: unknown) => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const shortJson = (value: unknown, max = 150) => {
  const text = displayJson(value);
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max) + '...';
};

const dateText = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
};

const useProviderLogs = (
  mode: LogMode,
  params: {
    page: number;
    limit: number;
    provider: string;
    status: string;
  }
) => {
  const fetch = useFetch();
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    ...(params.provider ? { provider: params.provider } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  const path =
    mode === 'publish'
      ? `/provider-logs/publish-attempts?${query.toString()}`
      : `/provider-logs/connection?${query.toString()}`;

  return useSWR<ListResponse<PublishAttemptRow | ConnectionLogRow>>(
    path,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load provider logs');
      }
      return res.json();
    },
    {
      refreshInterval: 15000,
    }
  );
};

const DetailModal: FC<{
  title: string;
  row: PublishAttemptRow | ConnectionLogRow;
}> = ({ title, row }) => {
  const modal = useModals();
  const toaster = useToaster();

  const copyAll = useCallback(() => {
    copy(JSON.stringify(row, null, 2));
    toaster.show('Debug payload copied', 'success');
  }, [row, toaster]);

  return (
    <div className="w-full max-h-[80vh] overflow-auto rounded-[8px] border border-newTableBorder bg-newBgColorInner text-textColor shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-[12px] border-b border-newTableBorder bg-newBgColorInner px-[16px] py-[14px]">
        <div className="min-w-0">
          <div className="text-[16px] font-[700]">{title}</div>
          <div className="truncate text-[12px] opacity-70">{row.id}</div>
        </div>
        <div className="flex shrink-0 gap-[8px]">
          <Button className="acadepost-button-secondary" onClick={copyAll}>
            Copy
          </Button>
          <Button
            className="acadepost-button-primary"
            onClick={() => modal.closeAll()}
          >
            Close
          </Button>
        </div>
      </div>
      <div className="grid gap-[12px] p-[16px] lg:grid-cols-3">
        {[
          ['requestSummary', row.requestSummary],
          ['responseSummary', row.responseSummary],
          ['errorSummary', row.errorSummary],
        ].map(([label, value]) => (
          <div key={label as string} className="min-w-0">
            <div className="mb-[6px] text-[12px] font-[700] uppercase opacity-60">
              {label as string}
            </div>
            <pre className="max-h-[46vh] overflow-auto rounded-[8px] border border-newTableBorder bg-sixth p-[12px] text-[12px] leading-[1.45] whitespace-pre-wrap break-all">
              {displayJson(value)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProviderFilters: FC<{
  mode: LogMode;
  setMode: (mode: LogMode) => void;
  provider: string;
  setProvider: (provider: string) => void;
  status: string;
  setStatus: (status: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  resetPage: () => void;
}> = ({
  mode,
  setMode,
  provider,
  setProvider,
  status,
  setStatus,
  limit,
  setLimit,
  resetPage,
}) => {
  return (
    <div className="acadepost-surface-card flex flex-col gap-[14px] p-[14px]">
      <div className="grid grid-cols-2 gap-[8px] rounded-[8px] border border-newTableBorder bg-newBgColorInner p-[4px]">
        {[
          ['publish', 'Tentatives'],
          ['connection', 'Connexions'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              resetPage();
              setMode(value as LogMode);
            }}
            className={clsx(
              'h-[38px] rounded-[6px] px-[10px] text-[13px] font-[700] transition',
              mode === value
                ? 'acadepost-button-primary text-white'
                : 'text-textColor opacity-75 hover:opacity-100'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-[12px] md:grid-cols-3">
        <label className="flex min-w-0 flex-col gap-[6px] text-[12px] font-[700] uppercase opacity-80">
          Provider
          <input
            value={provider}
            onChange={(e) => {
              resetPage();
              setProvider(e.target.value.trim());
            }}
            placeholder="telegram"
            className="h-[40px] rounded-[8px] border border-newTableBorder bg-newBgColorInner px-[10px] text-[14px] normal-case text-textColor outline-none"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-[6px] text-[12px] font-[700] uppercase opacity-80">
          Status
          <input
            value={status}
            onChange={(e) => {
              resetPage();
              setStatus(e.target.value.trim());
            }}
            placeholder={mode === 'publish' ? 'completed' : 'success'}
            className="h-[40px] rounded-[8px] border border-newTableBorder bg-newBgColorInner px-[10px] text-[14px] normal-case text-textColor outline-none"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-[6px] text-[12px] font-[700] uppercase opacity-80">
          Rows
          <select
            value={limit}
            onChange={(e) => {
              resetPage();
              setLimit(parseInt(e.target.value, 10));
            }}
            className="h-[40px] rounded-[8px] border border-newTableBorder bg-newBgColorInner px-[10px] text-[14px] normal-case text-textColor outline-none"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

const PublishAttemptsTable: FC<{
  items: PublishAttemptRow[];
  openDetails: (row: PublishAttemptRow) => void;
}> = ({ items, openDetails }) => {
  return (
    <div className="min-w-[1040px]">
      <div className="grid grid-cols-[155px_120px_170px_180px_1fr_150px_90px] gap-[12px] border-b border-newTableBorder bg-newBgColorInner px-[12px] py-[10px] text-[12px] font-[700] uppercase opacity-70">
        <div>Started</div>
        <div>Status</div>
        <div>Provider</div>
        <div>Destination</div>
        <div>Operation</div>
        <div>Release</div>
        <div className="text-right">Details</div>
      </div>
      {items.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[155px_120px_170px_180px_1fr_150px_90px] gap-[12px] border-b border-newTableBorder px-[12px] py-[11px] text-[13px] last:border-b-0"
        >
          <div className="opacity-90">{dateText(row.startedAt)}</div>
          <div>
            <span
              className={clsx(
                'inline-flex rounded-full border px-[8px] py-[3px] text-[12px] font-[700]',
                statusTone(row.status)
              )}
            >
              {row.status}
            </span>
          </div>
          <div className="min-w-0">
            <div className="truncate font-[700]">{row.providerIdentifier}</div>
            <div className="truncate text-[12px] opacity-60">
              {row.providerCredential?.name || 'credential fallback'}
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate font-[700]">
              {row.integration?.name || '-'}
            </div>
            <div className="truncate text-[12px] opacity-60">
              {row.integration?.profile || row.integration?.id || '-'}
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate font-mono text-[12px]">
              {row.operationId}
            </div>
            <div className="truncate text-[12px] opacity-60">
              {shortJson(row.errorSummary || row.responseSummary, 90)}
            </div>
          </div>
          <div className="min-w-0">
            {row.releaseURL ? (
              <a
                href={row.releaseURL}
                target="_blank"
                className="truncate text-[#4cccb8] underline-offset-2 hover:underline"
              >
                open
              </a>
            ) : (
              <span className="opacity-60">-</span>
            )}
            <div className="truncate text-[12px] opacity-60">
              {row.durationMs !== null ? `${row.durationMs}ms` : '-'}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="acadepost-button-secondary !h-[34px] !px-[14px]"
              onClick={() => openDetails(row)}
            >
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const ConnectionLogsTable: FC<{
  items: ConnectionLogRow[];
  openDetails: (row: ConnectionLogRow) => void;
}> = ({ items, openDetails }) => {
  return (
    <div className="min-w-[920px]">
      <div className="grid grid-cols-[155px_120px_170px_170px_1fr_90px] gap-[12px] border-b border-newTableBorder bg-newBgColorInner px-[12px] py-[10px] text-[12px] font-[700] uppercase opacity-70">
        <div>Created</div>
        <div>Status</div>
        <div>Provider</div>
        <div>Credential</div>
        <div>Action</div>
        <div className="text-right">Details</div>
      </div>
      {items.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[155px_120px_170px_170px_1fr_90px] gap-[12px] border-b border-newTableBorder px-[12px] py-[11px] text-[13px] last:border-b-0"
        >
          <div className="opacity-90">{dateText(row.createdAt)}</div>
          <div>
            <span
              className={clsx(
                'inline-flex rounded-full border px-[8px] py-[3px] text-[12px] font-[700]',
                statusTone(row.status)
              )}
            >
              {row.status}
            </span>
          </div>
          <div className="truncate font-[700]">{row.providerIdentifier}</div>
          <div className="min-w-0">
            <div className="truncate font-[700]">
              {row.providerCredential?.name || '-'}
            </div>
            <div className="truncate text-[12px] opacity-60">
              {row.providerCredential?.status || '-'}
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate font-mono text-[12px]">{row.action}</div>
            <div className="truncate text-[12px] opacity-60">
              {shortJson(row.errorSummary || row.responseSummary, 110)}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="acadepost-button-secondary !h-[34px] !px-[14px]"
              onClick={() => openDetails(row)}
            >
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProviderLogsComponent: FC = () => {
  const modal = useModals();
  const [mode, setMode] = useState<LogMode>('publish');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error, mutate } = useProviderLogs(mode, {
    page,
    limit,
    provider,
    status,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
  const publishItems = useMemo(
    () => (data?.items || []) as PublishAttemptRow[],
    [data?.items]
  );
  const connectionItems = useMemo(
    () => (data?.items || []) as ConnectionLogRow[],
    [data?.items]
  );

  const openDetails = useCallback(
    (row: PublishAttemptRow | ConnectionLogRow) => {
      modal.openModal({
        closeOnClickOutside: true,
        withCloseButton: false,
        classNames: {
          modal: 'w-[100%] max-w-[1180px] text-textColor',
        },
        children: (
          <DetailModal
            title={mode === 'publish' ? 'Publish attempt' : 'Connection log'}
            row={row}
          />
        ),
      });
    },
    [modal, mode]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-auto bg-newBgColor p-[14px] text-textColor md:p-[20px]">
      <div className="flex flex-col gap-[8px] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[12px] font-[700] uppercase tracking-[0.04em] text-[#4cccb8]">
            Provider Publishing Pipeline
          </div>
          <h2 className="text-[24px] font-[800] leading-tight">
            Observabilite provider
          </h2>
        </div>
        <Button
          className="acadepost-button-secondary w-fit"
          onClick={() => mutate()}
        >
          Refresh
        </Button>
      </div>

      <ProviderFilters
        mode={mode}
        setMode={setMode}
        provider={provider}
        setProvider={setProvider}
        status={status}
        setStatus={setStatus}
        limit={limit}
        setLimit={setLimit}
        resetPage={() => setPage(0)}
      />

      <div className="acadepost-surface-card min-h-[360px] overflow-hidden">
        <div className="flex items-center justify-between border-b border-newTableBorder px-[14px] py-[12px]">
          <div className="text-[15px] font-[800]">
            {mode === 'publish'
              ? 'Provider Publish Attempt Log'
              : 'Provider Connection Log'}
          </div>
          <div className="text-[13px] opacity-70">
            {data ? `${data.total} total` : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="p-[24px]">
            <LoadingComponent />
          </div>
        ) : error ? (
          <div className="p-[18px] text-[#fda100]">
            Failed to load provider logs.
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-[18px] opacity-70">No provider logs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            {mode === 'publish' ? (
              <PublishAttemptsTable
                items={publishItems}
                openDetails={openDetails}
              />
            ) : (
              <ConnectionLogsTable
                items={connectionItems}
                openDetails={openDetails}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[13px] opacity-70">
          Page {page + 1} of {totalPages}
        </div>
        <div className="flex gap-[8px]">
          <Button
            secondary
            className="acadepost-button-secondary"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            className="acadepost-button-primary"
            disabled={!data?.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
