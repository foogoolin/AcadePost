import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';
import { Readable } from 'stream';
import { PostTemplatesRepository } from '@gitroom/nestjs-libraries/database/prisma/post-templates/post.templates.repository';
import { MediaService } from '@gitroom/nestjs-libraries/database/prisma/media/media.service';
import {
  PostTemplateDto,
  RenderPostTemplateDto,
} from '@gitroom/nestjs-libraries/dtos/post-templates/post.templates.dto';
import { UploadFactory } from '@gitroom/nestjs-libraries/upload/upload.factory';
import { ssrfSafeDispatcher } from '@gitroom/nestjs-libraries/dtos/webhooks/ssrf.safe.dispatcher';
import { isSafePublicHttpsUrl } from '@gitroom/nestjs-libraries/dtos/webhooks/webhook.url.validator';

const TEMPLATE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  post_1_1: { width: 1080, height: 1080 },
  post_3_4: { width: 1080, height: 1440 },
  carousel_1_1: { width: 1080, height: 1080 },
  carousel_3_4: { width: 1080, height: 1440 },
};
const TEMPLATE_MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class PostTemplatesService {
  private storage = UploadFactory.createStorage();

  constructor(
    private _postTemplatesRepository: PostTemplatesRepository,
    private _mediaService: MediaService
  ) {}

  list(orgId: string) {
    return this._postTemplatesRepository.list(orgId);
  }

  get(orgId: string, id: string) {
    return this._postTemplatesRepository.get(orgId, id);
  }

  create(orgId: string, body: PostTemplateDto) {
    return this._postTemplatesRepository.create(orgId, body);
  }

  async update(orgId: string, id: string, body: PostTemplateDto) {
    const template = await this.get(orgId, id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return this._postTemplatesRepository.update(orgId, id, body);
  }

  delete(orgId: string, id: string) {
    return this._postTemplatesRepository.delete(orgId, id);
  }

  async render(orgId: string, id: string, body: RenderPostTemplateDto) {
    const template = await this.get(orgId, id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const source = await this.loadImageBuffer(orgId, body);
    const dimensions =
      TEMPLATE_DIMENSIONS[template.type] || TEMPLATE_DIMENSIONS.post_1_1;
    const config = (template.config || {}) as any;
    const overlay = {
      ...(config.overlay || {}),
      mainText: body.mainText || config.overlay?.mainText || '',
      websiteLabel: body.websiteLabel || config.overlay?.websiteLabel || '',
    };

    const base = await sharp(source)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .png()
      .toBuffer();

    const svg = this.createOverlaySvg(dimensions, overlay);
    const buffer = await sharp(base)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    const uploadedFile = await this.storage.uploadFile({
      buffer,
      mimetype: 'image/png',
      size: buffer.length,
      path: '',
      fieldname: 'file',
      destination: '',
      stream: new Readable(),
      filename: 'acadepost-template-preview.png',
      originalname: 'acadepost-template-preview.png',
      encoding: '7bit',
    });

    return this._mediaService.saveFile(
      orgId,
      uploadedFile.originalname,
      uploadedFile.path,
      'acadepost-template-preview.png'
    );
  }

  private async loadImageBuffer(orgId: string, body: RenderPostTemplateDto) {
    let url = body.imageUrl;

    if (body.mediaId) {
      const media = await this._mediaService.getMediaById(orgId, body.mediaId);
      if (!media) {
        throw new NotFoundException('Media not found');
      }
      url = media.path;
    }

    if (!url) {
      throw new BadRequestException('mediaId or imageUrl is required');
    }

    if (!body.mediaId && !(await isSafePublicHttpsUrl(url))) {
      throw new BadRequestException('imageUrl must be a safe public HTTPS URL');
    }

    const response = await this.fetchPublicImage(url);

    if (!response.ok) {
      throw new BadRequestException('Failed to load source image');
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > TEMPLATE_MAX_SOURCE_IMAGE_BYTES) {
      throw new BadRequestException('Source image is too large');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > TEMPLATE_MAX_SOURCE_IMAGE_BYTES) {
      throw new BadRequestException('Source image is too large');
    }

    return buffer;
  }

  private createOverlaySvg(
    dimensions: { width: number; height: number },
    overlay: Record<string, any>
  ) {
    const position = overlay.position || 'bottom_left';
    const color = this.normalizeHex(overlay.gradientColor || '#000000');
    const opacity = Math.min(Math.max(Number(overlay.opacity ?? 0.62), 0), 1);
    const padding = 64;
    const textColor = overlay.textColor || '#ffffff';
    const x = position.includes('right') ? dimensions.width - padding : padding;
    const y = position.includes('top') ? padding + 20 : dimensions.height - 220;
    const anchor = position.includes('right') ? 'end' : 'start';
    const gradient = this.gradientVector(position);
    const website = this.escapeText(overlay.websiteLabel || overlay.websiteUrl || '');
    const lines = this.wrapText(String(overlay.mainText || ''), 34).slice(0, 6);

    return `
<svg width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="overlay" x1="${gradient.x1}" y1="${gradient.y1}" x2="${gradient.x2}" y2="${gradient.y2}">
      <stop offset="0%" stop-color="${color}" stop-opacity="${opacity}" />
      <stop offset="72%" stop-color="${color}" stop-opacity="${Math.max(opacity * 0.28, 0.08)}" />
      <stop offset="100%" stop-color="${color}" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#overlay)" />
  ${website ? `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${textColor}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600" letter-spacing="0">${website}</text>` : ''}
  ${lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + 62 + index * 48}" text-anchor="${anchor}" fill="${textColor}" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="600" letter-spacing="0">${this.escapeText(line)}</text>`
    )
    .join('')}
</svg>`;
  }

  private gradientVector(position: string) {
    if (position === 'top_right') {
      return { x1: '100%', y1: '0%', x2: '0%', y2: '100%' };
    }
    if (position === 'bottom_right') {
      return { x1: '100%', y1: '100%', x2: '0%', y2: '0%' };
    }
    if (position === 'top_left') {
      return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' };
    }
    return { x1: '0%', y1: '100%', x2: '100%', y2: '0%' };
  }

  private async fetchPublicImage(url: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      return await fetch(url, {
        signal: controller.signal,
        dispatcher: ssrfSafeDispatcher,
      } as any);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new BadRequestException('Timed out while loading source image');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeHex(value: string) {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
  }

  private escapeText(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private wrapText(value: string, size: number) {
    const words = value.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > size && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  }
}
