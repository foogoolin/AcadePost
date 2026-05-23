'use client';

import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AddEditModalProps } from '@gitroom/frontend/components/new-launch/add.edit.modal';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { PicksSocialsComponent } from '@gitroom/frontend/components/new-launch/picks.socials.component';
import { EditorWrapper } from '@gitroom/frontend/components/new-launch/editor';
import { SelectCurrent } from '@gitroom/frontend/components/new-launch/select.current';
import { ShowAllProviders } from '@gitroom/frontend/components/new-launch/providers/show.all.providers';
import { useExistingData } from '@gitroom/frontend/components/launches/helpers/use.existing.data';
import { useLaunchStore } from '@gitroom/frontend/components/new-launch/store';
import { DatePicker } from '@gitroom/frontend/components/launches/helpers/date.picker';
import { useShallow } from 'zustand/react/shallow';
import { RepeatComponent } from '@gitroom/frontend/components/launches/repeat.component';
import { TagsComponent } from '@gitroom/frontend/components/launches/tags.component';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { weightedLength } from '@gitroom/helpers/utils/count.length';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { capitalize } from 'lodash';
import { SelectCustomer } from '@gitroom/frontend/components/launches/select.customer';
import { CopilotPopup } from '@copilotkit/react-ui';
import { DummyCodeComponent } from '@gitroom/frontend/components/new-launch/dummy.code.component';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import {
  SettingsIcon,
  ChevronDownIcon,
  CloseIcon,
  TrashIcon,
  DropdownArrowSmallIcon,
} from '@gitroom/frontend/components/ui/icons';
import { useHasScroll } from '@gitroom/frontend/components/ui/is.scroll.hook';
import { useShortlinkPreference } from '@gitroom/frontend/components/settings/shortlink-preference.component';
import dayjs from 'dayjs';
import { Button } from '@gitroom/react/form/button';
import { OperationSelector } from '@gitroom/frontend/components/new-launch/operation.selector';
import { buildComposerDestinationContract } from '@gitroom/frontend/components/new-launch/provider-operation.contract';

function countCharacters(text: string, type: string): number {
  if (type !== 'x') {
    return text.length;
  }
  return weightedLength(text);
}

export const ManageModal: FC<AddEditModalProps> = (props) => {
  const t = useT();
  const fetch = useFetch();
  const ref = useRef(null);
  const existingData = useExistingData();
  const [loading, setLoading] = useState(false);
  const [testingPost, setTestingPost] = useState(false);
  const toaster = useToaster();
  const modal = useModals();
  const [showSettings, setShowSettings] = useState(false);
  const { data: shortlinkPreferenceData } = useShortlinkPreference();
  const persistedPostValueIds = useMemo(
    () =>
      new Set(
        (existingData?.posts || [])
          .map((post: any) => post.id)
          .filter((id: string | undefined): id is string => Boolean(id))
      ),
    [existingData?.posts]
  );

  const { addEditSets, mutate, customClose, dummy } = props;

  const {
    selectedIntegrations,
    hide,
    date,
    setDate,
    repeater,
    setRepeater,
    tags,
    setTags,
    integrations,
    setSelectedIntegrations,
    locked,
    current,
    activateExitButton,
    setHide,
    providerSelections,
  } = useLaunchStore(
    useShallow((state) => ({
      hide: state.hide,
      setHide: state.setHide,
      date: state.date,
      setDate: state.setDate,
      current: state.current,
      repeater: state.repeater,
      setRepeater: state.setRepeater,
      tags: state.tags,
      setTags: state.setTags,
      selectedIntegrations: state.selectedIntegrations,
      integrations: state.integrations,
      setSelectedIntegrations: state.setSelectedIntegrations,
      locked: state.locked,
      activateExitButton: state.activateExitButton,
      providerSelections: state.providerSelections,
    }))
  );

  useEffect(() => {
    if (hide) {
      setHide(false);
    }
  }, [hide]);

  const currentIntegrationText = useMemo(() => {
    if (current === 'global') {
      return (
        <div className="flex items-center gap-[10px]">
          <div className="relative">
            <SettingsIcon size={15} className="text-current" />
          </div>
          <div>Settings</div>
        </div>
      );
    }

    const currentIntegration = integrations.find((p) => p.id === current)!;

    return (
      <div className="flex items-center gap-[10px]">
        <div className="relative">
          <img
            src={`/icons/platforms/${currentIntegration.identifier}.png`}
            className="w-[20px] h-[20px] rounded-[4px]"
            alt={currentIntegration.identifier}
          />
          <SettingsIcon
            size={15}
            className="text-current absolute -end-[5px] -bottom-[5px]"
          />
        </div>
        <div>
          {currentIntegration.name} {t('channel_settings', 'Settings')}
        </div>
      </div>
    );
  }, [current]);

  const changeCustomer = useCallback(
    (customer: string) => {
      const neededIntegrations = integrations.filter(
        (p) => p?.customer?.id === customer
      );
      setSelectedIntegrations(
        neededIntegrations.map((p) => ({
          settings: {},
          selectedIntegrations: p,
        }))
      );
    },
    [integrations]
  );

  const askClose = useCallback(async () => {
    if (!activateExitButton || dummy) {
      return;
    }

    if (
      await deleteDialog(
        t(
          'are_you_sure_you_want_to_close_this_modal_all_data_will_be_lost',
          'Are you sure you want to close this modal? (all data will be lost)'
        ),
        t('yes_close_it', 'Yes, close it!')
      )
    ) {
      if (customClose) {
        customClose();
        return;
      }
      modal.closeAll();
    }
  }, [activateExitButton, dummy]);

  const deletePost = useCallback(async () => {
    setLoading(true);
    if (
      !(await deleteDialog(
        t(
          'are_you_sure_you_want_to_delete_post',
          'Are you sure you want to delete this post?'
        ),
        t('yes_delete_it', 'Yes, delete it!')
      ))
    ) {
      setLoading(false);
      return;
    }
    await fetch(`/posts/${existingData.group}`, {
      method: 'DELETE',
    });
    mutate();
    modal.closeAll();
    return;
  }, [existingData, mutate, modal]);

  const schedule = useCallback(
    (type: 'draft' | 'now' | 'schedule' | 'update') => async () => {
      if (
        (type === 'now' || type === 'schedule') &&
        (existingData?.posts?.[0]?.state === 'PUBLISHED' ||
          (existingData?.posts?.[0]?.state === 'QUEUE' &&
            dayjs().isAfter(date.utc())))
      ) {
        const whatToDo = await new Promise((resolve) => {
          modal.openModal({
            title: 'What do you want to do?',
            children: (
              <div className="flex flex-col">
                <div className="text-[20px] mb-[20px]">
                  This post was already published, what do you want to do?
                </div>
                <div className="flex w-full gap-[10px]">
                  <div className="flex-1 flex">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => resolve('update')}
                    >
                      Just update the post details
                    </Button>
                  </div>
                  <div className="flex-1 flex">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => resolve('republish')}
                    >
                      Republish the post
                    </Button>
                  </div>
                </div>
              </div>
            ),
          });
        });

        if (whatToDo === 'update') {
          type = 'update';
        }
      }

      setLoading(true);
      const checkAllValid = await ref.current.checkAllValid();

      const notEnoughChars = checkAllValid.filter((p: any) => {
        return p.values.some((a: any) => {
          return (
            countCharacters(
              stripHtmlValidation('normal', a.content, true),
              p?.integration?.identifier || ''
            ) === 0 && a.media?.length === 0
          );
        });
      });

      for (const item of notEnoughChars) {
        toaster.show(
          `${capitalize(item.integration.identifier.split('-')[0])} (${
            item.integration.name
          }):` +
            ' ' +
            t(
              'post_needs_content_or_image',
              'Your post should have at least one character or one image.'
            ),
          'warning'
        );
        setLoading(false);
        item.preview();
        return;
      }

      if (type !== 'draft') {
        for (const item of checkAllValid) {
          if (item.valid === false) {
            toaster.show(
              `${capitalize(item.integration.identifier.split('-')[0])} (${
                item.integration.name
              }): ${t('please_fix_your_settings', 'Please fix your settings')}`,
              'warning'
            );
            item.fix();
            setLoading(false);
            setShowSettings(true);
            return;
          }

          if (item.errors !== true) {
            toaster.show(
              `${capitalize(item.integration.identifier.split('-')[0])} (${
                item.integration.name
              }): ${item.errors}`,
              'warning'
            );
            item.preview();
            setLoading(false);
            setShowSettings(false);
            return;
          }
        }

        const sliceNeeded = checkAllValid.filter((p: any) => {
          return p.values.some((a: any) => {
            const strip = stripHtmlValidation('normal', a.content, true);
            const weightedLength = countCharacters(
              strip,
              p?.integration?.identifier || ''
            );
            const totalCharacters =
              weightedLength > strip.length ? weightedLength : strip.length;

            return totalCharacters > (p.maximumCharacters || 1000000);
          });
        });

        for (const item of sliceNeeded) {
          toaster.show(
            `${item?.integration?.name} (${item?.integration?.identifier}) ${t(
              'post_is_too_long',
              'post is too long, please fix it'
            )}`,
            'warning'
          );
          item.preview();
          setLoading(false);
          return;
        }
      }

      const shortlinkPreference = shortlinkPreferenceData?.shortlink || 'ASK';

      let shortLink = false;

      if (!dummy && shortlinkPreference !== 'NO') {
        const shortLinkUrl = await (
          await fetch('/posts/should-shortlink', {
            method: 'POST',
            body: JSON.stringify({
              messages: checkAllValid.flatMap((p: any) =>
                p.values.flatMap((a: any) => a.content)
              ),
            }),
          })
        ).json();

        if (shortLinkUrl.ask) {
          if (shortlinkPreference === 'YES') {
            // Automatically shortlink without asking
            shortLink = true;
          } else {
            // ASK: Show the dialog
            shortLink = await deleteDialog(
              t(
                'shortlink_urls_question',
                'Do you want to shortlink the URLs? it will let you get statistics over clicks'
              ),
              t('yes_shortlink_it', 'Yes, shortlink it!')
            );
          }
        }
      }

      const group = existingData.group || makeId(10);
      const data = {
        type,
        ...(repeater ? { inter: repeater } : {}),
        tags,
        shortLink,
        date: date.utc().format('YYYY-MM-DDTHH:mm:ss'),
        posts: checkAllValid.map((post: any) => {
          const providerOperation = buildComposerDestinationContract({
            destinationId: post.integration.id,
            providerIdentifier: post.integration.identifier,
            stored: providerSelections[post.integration.id],
            values: post.values,
          });

          return {
            integration: {
              id: post.integration.id,
            },
            group,
            settings: {
              ...(post.settings || {}),
              providerOperation,
            },
            value: post.values.map((value: any) => ({
              ...(value.id && persistedPostValueIds.has(value.id)
                ? { id: value.id }
                : {}),
              content: value.content,
              delay: value.delay || 0,
              image:
                (value?.media || []).map(
                  ({ id, path, alt, thumbnail, thumbnailTimestamp }: any) => ({
                    id,
                    path,
                    alt,
                    thumbnail,
                    thumbnailTimestamp,
                  })
                ) || [],
            })),
          };
        }),
      };

      if (dummy) {
        modal.openModal({
          title: '',
          children: <DummyCodeComponent code={data} />,
          classNames: {
            modal: 'w-[100%] bg-transparent text-textColor',
          },
          size: '100%',
          withCloseButton: false,
          closeOnEscape: true,
          closeOnClickOutside: true,
        });

        setLoading(false);
      }

      if (!dummy) {
        addEditSets
          ? addEditSets(data)
          : await fetch('/posts', {
              method: 'POST',
              body: JSON.stringify(data),
            });

        if (!addEditSets) {
          mutate();
          toaster.show(
            !existingData.integration
              ? t('added_successfully', 'Added successfully')
              : t('updated_successfully', 'Updated successfully')
          );
        }
        if (customClose) {
          setTimeout(() => {
            customClose();
          }, 2000);
        }

        if (!addEditSets) {
          modal.closeAll();
        }
      }
    },
    [
      ref,
      repeater,
      tags,
      date,
      addEditSets,
      dummy,
      shortlinkPreferenceData,
      providerSelections,
    ]
  );

  const testCurrentPost = useCallback(async () => {
    if (selectedIntegrations.length === 0) {
      toaster.show(
        t(
          'choose_destination_before_test',
          'Choose a destination before testing'
        ),
        'warning'
      );
      return;
    }

    const checkAllValid = await ref.current.checkAllValid();
    const target =
      current !== 'global'
        ? checkAllValid.find((item: any) => item.integration.id === current)
        : selectedIntegrations.length === 1
        ? checkAllValid[0]
        : undefined;

    if (!target) {
      toaster.show(
        t(
          'choose_one_destination_before_test',
          'Choose one destination tab before testing this post.'
        ),
        'warning'
      );
      return;
    }

    const hasContent = target.values.some((value: any) => {
      const content = stripHtmlValidation('normal', value.content, true).trim();
      return content.length > 0 || (value.media || []).length > 0;
    });

    if (!hasContent) {
      toaster.show(
        t(
          'post_needs_content_or_image',
          'Your post should have at least one character or one image.'
        ),
        'warning'
      );
      target.preview();
      return;
    }

    if (target.valid === false) {
      toaster.show(
        `${capitalize(target.integration.identifier.split('-')[0])} (${
          target.integration.name
        }): ${t('please_fix_your_settings', 'Please fix your settings')}`,
        'warning'
      );
      target.fix();
      setShowSettings(true);
      return;
    }

    if (target.errors !== true) {
      toaster.show(
        `${capitalize(target.integration.identifier.split('-')[0])} (${
          target.integration.name
        }): ${target.errors}`,
        'warning'
      );
      target.preview();
      setShowSettings(false);
      return;
    }

    const firstTooLong = target.values.find((value: any) => {
      const strip = stripHtmlValidation('normal', value.content, true);
      const totalCharacters = Math.max(
        countCharacters(strip, target?.integration?.identifier || ''),
        strip.length
      );
      return totalCharacters > (target.maximumCharacters || 1000000);
    });

    if (firstTooLong) {
      toaster.show(
        `${target?.integration?.name} (${target?.integration?.identifier}) ${t(
          'post_is_too_long',
          'post is too long, please fix it'
        )}`,
        'warning'
      );
      target.preview();
      return;
    }

    const providerOperation = buildComposerDestinationContract({
      destinationId: target.integration.id,
      providerIdentifier: target.integration.identifier,
      stored: providerSelections[target.integration.id],
      values: target.values,
    });
    const message =
      target.values
        .map((value: any) => value.content || '')
        .filter((content: string) => content.trim())
        .join('\n\n') || undefined;
    const mediaUrls = target.values
      .flatMap((value: any) => value.media || [])
      .map((media: any) => media.path || media.url || '')
      .filter(Boolean)
      .map((mediaPath: string) => {
        try {
          return new URL(mediaPath, window.location.origin).href;
        } catch {
          return mediaPath;
        }
      });

    const resolveCredentialId = async () => {
      if (target.integration.providerCredentialId) {
        return target.integration.providerCredentialId;
      }

      const response = await fetch('/provider-credentials');
      if (!response.ok) {
        return '';
      }

      const credentials = (await response.json()) || [];
      const matches = credentials.filter(
        (credential: any) =>
          credential.enabled &&
          credential.providerIdentifier === target.integration.identifier
      );

      return matches.length === 1 ? matches[0].id : '';
    };

    setTestingPost(true);
    try {
      const credentialId = await resolveCredentialId();
      if (!credentialId) {
        toaster.show(
          t(
            'no_provider_credential_for_test_post',
            'No single enabled credential is linked to this destination.'
          ),
          'warning'
        );
        return;
      }

      const response = await fetch(
        `/provider-credentials/${credentialId}/test-post`,
        {
          method: 'POST',
          body: JSON.stringify({
            integrationId: target.integration.id,
            message,
            mediaUrls,
            operationId: providerOperation.operationId,
          }),
        }
      );
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

      toaster.show(
        details?.releaseURL
          ? `Test post publié: ${details.releaseURL}`
          : 'Test post publié',
        'success'
      );
    } catch (error: any) {
      toaster.show(error?.message || 'Test post impossible', 'warning');
    } finally {
      setTestingPost(false);
    }
  }, [
    current,
    fetch,
    providerSelections,
    selectedIntegrations,
    toaster,
    t,
  ]);

  return (
    <div className="w-full h-full flex-1 p-[40px] flex relative">
      <div className="flex flex-1 bg-newBgColorInner rounded-[20px] flex-col">
        <div className="flex-1 flex">
          <div className="flex flex-col flex-1 border-e border-newBorder">
            <div className="bg-newBgColor h-[65px] rounded-s-[20px] !rounded-b-[0] flex items-center px-[20px] text-[20px] font-[600]">
              {t('create_post_title', 'Create Post')}
            </div>
            <div className="flex-1 flex flex-col gap-[16px]">
              <div
                className={clsx('flex-1 relative', showSettings && 'hidden')}
              >
                <div
                  id="social-content"
                  className="gap-[32px] flex flex-col pe-[8px] pt-[20px] ps-[20px] absolute top-0 left-0 w-full h-full overflow-x-hidden overflow-y-scroll scrollbar scrollbar-thumb-newColColor scrollbar-track-newBgColorInner"
                >
                  <div className="flex w-full">
                    <div className="flex flex-1">
                      <PicksSocialsComponent toolTip={true} />
                    </div>
                    <div>
                      {!dummy && (
                        <SelectCustomer
                          onChange={changeCustomer}
                          integrations={integrations}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 gap-[6px] flex-col">
                    <div>{!existingData.integration && <SelectCurrent />}</div>
                    <OperationSelector />
                    <div className="flex-1 flex">
                      {!hide && <EditorWrapper totalPosts={1} value="" />}
                    </div>
                    <div
                      id="social-empty"
                      className={clsx(
                        'pb-[16px]'
                        // current !== 'global' && 'hidden'
                      )}
                    />
                  </div>
                </div>
              </div>
              <div
                id="wrapper-settings"
                className={clsx(
                  'pb-[20px] px-[20px] select-none',
                  showSettings && 'flex-1 flex pt-[20px]',
                  current === 'global' && 'hidden'
                )}
              >
                <div className="flex-1 flex flex-col rounded-[12px] gap-[12px] overflow-hidden bg-newSettings">
                  <button
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className={clsx(
                      'acadepost-button-primary w-full !justify-between !rounded-[12px] !px-[12px] !py-[12px]',
                      showSettings ? '!rounded-b-none' : ''
                    )}
                  >
                    <div className="flex-1 text-start text-[14px] font-[700]">
                      {currentIntegrationText}
                    </div>
                    <div>
                      <ChevronDownIcon
                        rotated={showSettings}
                        className="text-current"
                      />
                    </div>
                  </button>
                  <div
                    className={clsx(
                      !showSettings ? 'hidden' : 'flex-1',
                      'text-[14px] text-textColor font-[500] relative'
                    )}
                  >
                    <div className="absolute left-0 top-0 w-full h-full flex flex-col overflow-x-hidden overflow-y-auto scrollbar scrollbar-thumb-newBgColorInner scrollbar-track-newColColor">
                      <div
                        id="social-settings"
                        className="flex flex-col gap-[20px] bg-newBgColor"
                      />
                    </div>
                  </div>
                  <style>
                    {`#social-settings [data-id="${current}"] {display: block !important;}`}
                  </style>
                </div>
              </div>
            </div>
          </div>
          <div className="w-[580px] flex flex-col">
            <div className="bg-newBgColor h-[65px] rounded-e-[20px] !rounded-b-[0] flex items-center px-[20px] text-[20px] font-[600]">
              <div className="flex-1">{t('post_preview', 'Post Preview')}</div>
              <div className="cursor-pointer">
                <CloseIcon onClick={askClose} className="text-[#A3A3A3]" />
              </div>
            </div>
            <div className="flex-1 relative">
              <Scrollable
                scrollClasses="!pe-[20px]"
                className="absolute top-0 p-[20px] pe-[8px] left-0 w-full h-full overflow-x-hidden overflow-y-scroll scrollbar scrollbar-thumb-newColColor scrollbar-track-newBgColorInner"
              >
                <ShowAllProviders ref={ref} />
              </Scrollable>
            </div>
          </div>
        </div>
        <div className="select-none h-[84px] py-[20px] border-t border-newBorder flex items-center">
          <div className="flex-1 flex ps-[20px] gap-[8px]">
            {!dummy && (
              <TagsComponent
                name="tags"
                label={t('tags', 'Tags')}
                initial={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                }}
              />
            )}

            {!dummy && (
              <RepeatComponent repeat={repeater} onChange={setRepeater} />
            )}
          </div>
          <div className="pe-[20px] flex items-center justify-end gap-[8px]">
            {existingData?.integration && (
              <button
                type="button"
                onClick={deletePost}
                className="acadepost-button-secondary !text-[#FF3F3F] text-[15px]"
              >
                <div>
                  <TrashIcon />
                </div>
                <div>{t('delete_post', 'Delete Post')}</div>
              </button>
            )}
            <DatePicker onChange={setDate} date={date} />
            {!addEditSets && (
              <button
                type="button"
                disabled={
                  selectedIntegrations.length === 0 ||
                  loading ||
                  testingPost ||
                  locked
                }
                onClick={schedule('draft')}
                className="acadepost-button-secondary relative h-[44px] text-[15px]"
              >
                {loading && (
                  <div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
                    <div className="animate-spin h-[20px] w-[20px] rounded-full border-4 border-current border-t-transparent" />
                  </div>
                )}
                <div className={clsx(loading && 'invisible')}>
                  {t('save_as_draft', 'Save as Draft')}
                </div>
              </button>
            )}
            {addEditSets && (
              <button
                type="button"
                className="acadepost-button-primary h-[44px] min-w-[180px] text-[15px]"
                disabled={
                  selectedIntegrations.length === 0 ||
                  loading ||
                  testingPost ||
                  locked
                }
                onClick={schedule('draft')}
              >
                Save Set
              </button>
            )}
            {!addEditSets && (
              <button
                type="button"
                disabled={
                  selectedIntegrations.length === 0 ||
                  loading ||
                  testingPost ||
                  locked
                }
                onClick={testCurrentPost}
                className="acadepost-button-secondary relative h-[44px] text-[15px]"
              >
                {testingPost && (
                  <div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
                    <div className="animate-spin h-[20px] w-[20px] rounded-full border-4 border-current border-t-transparent" />
                  </div>
                )}
                <div className={clsx(testingPost && 'invisible')}>
                  {t('test_post', 'Test post')}
                </div>
              </button>
            )}
            {!addEditSets && (
              <div className="group cursor-pointer relative">
                <button
                  type="button"
                  disabled={
                    selectedIntegrations.length === 0 ||
                    loading ||
                    testingPost ||
                    locked
                  }
                  onClick={schedule('schedule')}
                  className="acadepost-button-primary relative h-[44px] min-w-[180px] text-[15px]"
                >
                  {loading && (
                    <div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
                      <div className="animate-spin h-[20px] w-[20px] rounded-full border-4 border-current border-t-transparent" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      'text-[15px] font-[600]',
                      loading && 'invisible'
                    )}
                  >
                    {selectedIntegrations.length === 0
                      ? t('check_circles_above', 'Check the circles above')
                      : dummy
                      ? t('create_output', 'Create output')
                      : !existingData?.integration
                      ? t('add_to_calendar', 'Add to calendar')
                      : existingData?.posts?.[0]?.state === 'DRAFT'
                      ? t('schedule', 'Schedule')
                      : t('update', 'Update')}
                  </div>
                  {!dummy && (
                    <div className="flex justify-center items-center h-[20px] w-[20px] pt-[4px] arrow-change">
                      <DropdownArrowSmallIcon className="group-hover:rotate-180 text-current" />
                    </div>
                  )}
                </button>

                {!dummy && (
                  <button
                    type="button"
                    onClick={schedule('now')}
                    disabled={
                      selectedIntegrations.length === 0 ||
                      loading ||
                      testingPost ||
                      locked
                    }
                    className="acadepost-button-secondary acadepost-button-standard post-now z-[300] hidden group-hover:flex w-[220px] absolute bottom-[100%] -left-[20px] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {t('post_now', 'Post Now')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <CopilotPopup
        hitEscapeToClose={false}
        clickOutsideToClose={true}
        instructions={`
You are an assistant that help the user to schedule their social media posts,
Here are the things you can do:
- Add a new comment / post to the list of posts
- Delete a comment / post from the list of posts
- Add content to the comment / post
- Activate or deactivate the comment / post

Post content can be added using the addPostContentFor{num} function.
After using the addPostFor{num} it will create a new addPostContentFor{num+ 1} function.
`}
        labels={{
          title: t('your_assistant', 'Your Assistant'),
          initial: t(
            'assistant_initial_message',
            'Hi! I can help you to refine your social media posts.'
          ),
        }}
      />
    </div>
  );
};

const Scrollable: FC<{
  className: string;
  scrollClasses: string;
  children: ReactNode;
}> = ({ className, scrollClasses, children }) => {
  const ref = useRef(undefined);
  const hasScroll = useHasScroll(ref);
  return (
    <div className={clsx(className, hasScroll && scrollClasses)} ref={ref}>
      {children}
    </div>
  );
};
