'use client';

import React, { FC, useMemo } from 'react';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useLaunchStore } from '@gitroom/frontend/components/new-launch/store';
import {
  getDefaultOperationId,
  getProviderOperationOptions,
  resolveProviderOperationSelection,
} from '@gitroom/frontend/components/new-launch/provider-operation.contract';

export const OperationSelector: FC = () => {
  const t = useT();
  const {
    current,
    global,
    internal,
    selectedIntegrations,
    providerSelections,
    setProviderOperation,
    locked,
  } = useLaunchStore(
    useShallow((state) => ({
      current: state.current,
      global: state.global,
      internal: state.internal,
      selectedIntegrations: state.selectedIntegrations,
      providerSelections: state.providerSelections,
      setProviderOperation: state.setProviderOperation,
      locked: state.locked,
    }))
  );

  const selectedIntegration = useMemo(() => {
    if (current !== 'global') {
      return selectedIntegrations.find(
        (item) => item.integration.id === current
      );
    }

    if (selectedIntegrations.length === 1) {
      return selectedIntegrations[0];
    }

    return undefined;
  }, [current, selectedIntegrations]);

  const values = useMemo(() => {
    if (!selectedIntegration) {
      return [];
    }

    return (
      internal.find(
        (item) => item.integration.id === selectedIntegration.integration.id
      )?.integrationValue || global
    );
  }, [global, internal, selectedIntegration]);

  if (!selectedIntegration) {
    return null;
  }

  const providerIdentifier = selectedIntegration.integration.identifier;
  const operationOptions = getProviderOperationOptions(providerIdentifier);

  if (operationOptions.length === 0) {
    return null;
  }

  const selection = resolveProviderOperationSelection(
    providerIdentifier,
    providerSelections[selectedIntegration.integration.id],
    values
  );
  const defaultOperationId = getDefaultOperationId(providerIdentifier, values);
  const activeOperation = operationOptions.find(
    (option) => option.id === selection.operationId
  );
  const activeOperationIsSupported =
    activeOperation?.supports(values) || selection.operationId === defaultOperationId;

  return (
    <div className="acadepost-surface-card flex flex-col gap-[12px] p-[14px]">
      <div className="flex flex-wrap items-start justify-between gap-[10px]">
        <div className="min-w-0">
          <div className="text-[12px] font-[800] uppercase text-textColor/60">
            {t('destination_operation', 'Opération de destination')}
          </div>
          <div className="mt-[3px] truncate text-[14px] font-[800] text-textColor">
            {selectedIntegration.integration.name}
          </div>
        </div>
        <div
          className={clsx(
            'rounded-full border px-[10px] py-[5px] text-[11px] font-[800]',
            selection.source === 'default'
              ? 'border-acadeAmber/50 text-acadeAmber'
              : 'border-acadeMint/50 text-acadeMint'
          )}
        >
          {selection.source === 'default'
            ? t('operation_auto', 'Auto')
            : t('operation_manual', 'Manuel')}
        </div>
      </div>

      <div className="flex flex-wrap gap-[8px]">
        {operationOptions.map((option) => {
          const selected = option.id === selection.operationId;
          const supported = option.supports(values);

          return (
            <button
              key={option.id}
              type="button"
              disabled={locked}
              className={clsx(
                selected
                  ? 'acadepost-button-primary'
                  : 'acadepost-button-secondary',
                'text-[12px]',
                !supported && !selected && 'opacity-75'
              )}
              data-tooltip-id="tooltip"
              data-tooltip-content={option.description}
              onClick={() =>
                setProviderOperation(
                  selectedIntegration.integration.id,
                  providerIdentifier,
                  option.id
                )
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        className={clsx(
          'text-[12px] font-[600] leading-[1.45]',
          activeOperationIsSupported ? 'text-textColor/65' : 'text-acadeAmber'
        )}
      >
        {activeOperationIsSupported
          ? activeOperation?.description
          : t(
              'operation_may_not_match_content',
              'Cette opération peut nécessiter une autre forme de contenu.'
            )}
      </div>
    </div>
  );
};
