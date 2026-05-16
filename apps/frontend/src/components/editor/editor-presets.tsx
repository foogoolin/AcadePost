'use client';

import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { MediaBox } from '@gitroom/frontend/components/media/media.component';

type TemplateType = 'post_1_1' | 'post_3_4' | 'carousel_1_1' | 'carousel_3_4';
type OverlayPosition =
  | 'top_left'
  | 'top_right'
  | 'bottom_left'
  | 'bottom_right';

const presets: {
  type: TemplateType;
  label: string;
  description: string;
  width: number;
  height: number;
}[] = [
  {
    type: 'post_1_1',
    label: 'Post 1:1',
    description: 'Format carré 1080 x 1080',
    width: 1080,
    height: 1080,
  },
  {
    type: 'post_3_4',
    label: 'Post 3:4',
    description: 'Format vertical 1080 x 1440',
    width: 1080,
    height: 1440,
  },
  {
    type: 'carousel_1_1',
    label: 'Carrousel 1:1',
    description: 'Slide carré réutilisable',
    width: 1080,
    height: 1080,
  },
  {
    type: 'carousel_3_4',
    label: 'Carrousel 3:4',
    description: 'Slide vertical réutilisable',
    width: 1080,
    height: 1440,
  },
];

const positions: { value: OverlayPosition; label: string }[] = [
  { value: 'top_left', label: 'Haut gauche' },
  { value: 'top_right', label: 'Haut droite' },
  { value: 'bottom_left', label: 'Bas gauche' },
  { value: 'bottom_right', label: 'Bas droite' },
];

const defaultOverlay = {
  position: 'bottom_left' as OverlayPosition,
  gradientColor: '#000000',
  opacity: 0.62,
  gradientSize: 62,
  websiteLabel: 'acadenice.fr',
  websiteUrl: 'https://acadenice.fr',
  mainText: 'Votre accroche principale',
  textColor: '#ffffff',
};

export const EditorPresets: FC = () => {
  const fetch = useFetch();
  const toaster = useToaster();
  const modals = useModals();
  const fileRef = useRef<HTMLInputElement>(null);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [templateName, setTemplateName] = useState('Modèle AcadéNice');
  const [templateType, setTemplateType] = useState<TemplateType>('post_1_1');
  const [overlay, setOverlay] = useState(defaultOverlay);
  const [media, setMedia] = useState<{ id: string; path: string } | undefined>();
  const [previewMediaId, setPreviewMediaId] = useState<string | undefined>();
  const [isRendering, setIsRendering] = useState(false);

  const loadTemplates = useCallback(async () => {
    return (await fetch('/post-templates')).json();
  }, [fetch]);

  const { data: templates, mutate } = useSWR('post-templates', loadTemplates, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  const preset = useMemo(
    () => presets.find((item) => item.type === templateType)!,
    [templateType]
  );

  const config = useMemo(
    () => ({
      dimensions: { width: preset.width, height: preset.height },
      overlay,
      version: 1,
    }),
    [overlay, preset]
  );

  const chooseTemplate = useCallback((template: any) => {
    const templateConfig = template.config || {};
    setTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setOverlay({ ...defaultOverlay, ...(templateConfig.overlay || {}) });
    setPreviewMediaId(template.previewMediaId || undefined);
    if (template.previewMedia?.path) {
      setMedia({
        id: template.previewMedia.id,
        path: template.previewMedia.path,
      });
    }
  }, []);

  const openMediaLibrary = useCallback(() => {
    modals.openModal({
      title: 'Choisir une image',
      size: '900px',
      children: (close) => (
        <MediaBox
          type="image"
          closeModal={close}
          setMedia={(items) => {
            if (items?.[0]) {
              setMedia(items[0]);
            }
            close();
          }}
        />
      ),
    });
  }, [modals]);

  const uploadLocalFile = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/media/upload-simple', {
        method: 'POST',
        body: form,
      });
      const uploaded = await response.json();
      setMedia({ id: uploaded.id, path: uploaded.path });
      setPreviewMediaId(uploaded.id);
      toaster.show('Image importée', 'success');
    },
    [fetch, toaster]
  );

  const saveTemplate = useCallback(
    async (nextPreviewMediaId = previewMediaId) => {
      const payload = {
        name: templateName,
        type: templateType,
        config,
        previewMediaId: nextPreviewMediaId,
      };
      const response = await fetch(
        templateId ? `/post-templates/${templateId}` : '/post-templates',
        {
          method: templateId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );
      const saved = await response.json();
      setTemplateId(saved.id);
      setPreviewMediaId(saved.previewMediaId || nextPreviewMediaId);
      await mutate();
      toaster.show('Modèle enregistré', 'success');
      return saved;
    },
    [
      config,
      fetch,
      mutate,
      previewMediaId,
      templateId,
      templateName,
      templateType,
      toaster,
    ]
  );

  const renderPreview = useCallback(async () => {
    if (!media?.path) {
      toaster.show('Ajoutez une image avant de générer le rendu', 'warning');
      return;
    }

    setIsRendering(true);
    try {
      const blob = await renderTemplateToBlob(media.path, preset, overlay);
      const form = new FormData();
      form.append('file', blob, `${templateName || 'template'}.png`);
      const uploaded = await (
        await fetch('/media/upload-simple', {
          method: 'POST',
          body: form,
        })
      ).json();
      setPreviewMediaId(uploaded.id);
      await saveTemplate(uploaded.id);
      toaster.show('Rendu ajouté à la bibliothèque média', 'success');
    } catch (error: any) {
      toaster.show(error?.message || 'Impossible de générer le rendu', 'warning');
    } finally {
      setIsRendering(false);
    }
  }, [fetch, media?.path, overlay, preset, saveTemplate, templateName, toaster]);

  const updateOverlay = <K extends keyof typeof overlay>(
    key: K,
    value: (typeof overlay)[K]
  ) => {
    setOverlay((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="acadepost-editor-page flex w-full flex-1 overflow-auto">
      <div className="mx-auto grid w-full max-w-[1440px] gap-5 p-5 xl:grid-cols-[290px_minmax(0,1fr)_360px]">
        <aside className="acadepost-editor-panel p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-[700] text-textColor">
                Éditeur
              </h1>
              <p className="mt-1 text-[12px] text-newTableText">
                Modèles visuels réutilisables
              </p>
            </div>
            <button
              className="acadepost-editor-icon-button"
              onClick={() => {
                setTemplateId(undefined);
                setTemplateName('Modèle AcadéNice');
                setTemplateType('post_1_1');
                setOverlay(defaultOverlay);
                setMedia(undefined);
                setPreviewMediaId(undefined);
              }}
            >
              +
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {templates?.map((template: any) => (
              <button
                key={template.id}
                onClick={() => chooseTemplate(template)}
                className={clsx(
                  'acadepost-editor-list-item text-left',
                  template.id === templateId && 'is-active'
                )}
              >
                <span className="block text-[13px] font-[700]">
                  {template.name}
                </span>
                <span className="text-[11px] text-newTableText">
                  {presets.find((item) => item.type === template.type)?.label}
                </span>
              </button>
            ))}
            {!templates?.length && (
              <div className="acadepost-editor-empty p-4 text-[13px] text-newTableText">
                Aucun modèle enregistré.
              </div>
            )}
          </div>
        </aside>

        <main className="acadepost-editor-panel p-5">
          <div className="mb-5 flex flex-col gap-2 border-b border-newBorder pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-[700] uppercase tracking-[0.08em] text-newTableText">
                Canvas
              </p>
              <h2 className="text-[22px] font-[700] text-textColor">
                Aperçu du modèle
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="acadepost-editor-button secondary"
                onClick={openMediaLibrary}
              >
                Bibliothèque média
              </button>
              <button
                className="acadepost-editor-button secondary"
                onClick={() => fileRef.current?.click()}
              >
                Importer
              </button>
              <button
                className="acadepost-editor-button"
                disabled={isRendering}
                onClick={renderPreview}
              >
                {isRendering ? 'Rendu...' : 'Rendre en PNG'}
              </button>
            </div>
          </div>

          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadLocalFile(file);
              }
              event.target.value = '';
            }}
          />

          <div className="flex min-h-[620px] items-center justify-center">
            <div
              className="acadepost-editor-preview"
              style={{
                aspectRatio: `${preset.width} / ${preset.height}`,
                backgroundImage: media?.path ? `url(${media.path})` : undefined,
              }}
            >
              {!media?.path && (
                <div className="flex h-full w-full items-center justify-center text-center text-[14px] text-newTableText">
                  Ajoutez une image pour préparer le template.
                </div>
              )}
              <div
                className={clsx('acadepost-editor-gradient', overlay.position)}
                style={{
                  '--overlay-color': hexToRgb(overlay.gradientColor),
                  '--overlay-opacity': String(overlay.opacity),
                } as React.CSSProperties}
              />
              <div
                className={clsx(
                  'acadepost-editor-overlay-text',
                  overlay.position
                )}
                style={{ color: overlay.textColor }}
              >
                <span>{overlay.websiteLabel}</span>
                <strong>{overlay.mainText}</strong>
              </div>
            </div>
          </div>
        </main>

        <aside className="acadepost-editor-panel p-4">
          <div className="mb-4">
            <h2 className="text-[18px] font-[700] text-textColor">
              Paramètres
            </h2>
            <p className="mt-1 text-[12px] text-newTableText">
              Style proche calendrier: dense, carré, lisible.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <label className="acadepost-editor-field">
              <span>Nom</span>
              <input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              {presets.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setTemplateType(item.type)}
                  className={clsx(
                    'acadepost-editor-preset',
                    item.type === templateType && 'is-active'
                  )}
                >
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>

            <label className="acadepost-editor-field">
              <span>Position</span>
              <select
                value={overlay.position}
                onChange={(event) =>
                  updateOverlay('position', event.target.value as OverlayPosition)
                }
              >
                {positions.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="acadepost-editor-field">
              <span>Label site</span>
              <input
                value={overlay.websiteLabel}
                onChange={(event) =>
                  updateOverlay('websiteLabel', event.target.value)
                }
              />
            </label>

            <label className="acadepost-editor-field">
              <span>URL site</span>
              <input
                value={overlay.websiteUrl}
                onChange={(event) =>
                  updateOverlay('websiteUrl', event.target.value)
                }
              />
            </label>

            <label className="acadepost-editor-field">
              <span>Texte principal</span>
              <textarea
                rows={4}
                value={overlay.mainText}
                onChange={(event) =>
                  updateOverlay('mainText', event.target.value)
                }
              />
            </label>

            <div className="grid grid-cols-[1fr_72px] gap-2">
              <label className="acadepost-editor-field">
                <span>Couleur HEX</span>
                <input
                  value={overlay.gradientColor}
                  onChange={(event) =>
                    updateOverlay('gradientColor', event.target.value)
                  }
                />
              </label>
              <label className="acadepost-editor-color">
                <span />
                <input
                  type="color"
                  value={overlay.gradientColor}
                  onChange={(event) =>
                    updateOverlay('gradientColor', event.target.value)
                  }
                />
              </label>
            </div>

            <label className="acadepost-editor-field">
              <span>Opacité</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={overlay.opacity}
                onChange={(event) =>
                  updateOverlay('opacity', Number(event.target.value))
                }
              />
            </label>

            <button
              className="acadepost-editor-button"
              onClick={() => saveTemplate()}
            >
              Enregistrer le modèle
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

async function renderTemplateToBlob(
  imageUrl: string,
  preset: { width: number; height: number },
  overlay: typeof defaultOverlay
) {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas non disponible');
  }

  const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const left = (canvas.width - width) / 2;
  const top = (canvas.height - height) / 2;
  ctx.drawImage(image, left, top, width, height);

  const gradient = canvasGradient(ctx, canvas, overlay.position);
  const [r, g, b] = parseHex(overlay.gradientColor);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${overlay.opacity})`);
  gradient.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, ${overlay.opacity * 0.28})`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const right = overlay.position.includes('right');
  const bottom = overlay.position.includes('bottom');
  const x = right ? canvas.width - 64 : 64;
  const y = bottom ? canvas.height - 220 : 84;
  ctx.textAlign = right ? 'right' : 'left';
  ctx.fillStyle = overlay.textColor;
  ctx.font = '600 34px Inter, Arial, sans-serif';
  ctx.fillText(overlay.websiteLabel, x, y);
  ctx.font = '700 48px Inter, Arial, sans-serif';
  wrapCanvasText(ctx, overlay.mainText, x, y + 68, 760, 54);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Rendu impossible'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image illisible pour le rendu'));
    image.src = url;
  });
}

function canvasGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  position: OverlayPosition
) {
  if (position === 'top_right') {
    return ctx.createLinearGradient(canvas.width, 0, 0, canvas.height);
  }
  if (position === 'bottom_right') {
    return ctx.createLinearGradient(canvas.width, canvas.height, 0, 0);
  }
  if (position === 'top_left') {
    return ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  }
  return ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
  }
}

function parseHex(value: string) {
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
  return [
    parseInt(safe.slice(1, 3), 16),
    parseInt(safe.slice(3, 5), 16),
    parseInt(safe.slice(5, 7), 16),
  ];
}

function hexToRgb(value: string) {
  return parseHex(value).join(', ');
}
