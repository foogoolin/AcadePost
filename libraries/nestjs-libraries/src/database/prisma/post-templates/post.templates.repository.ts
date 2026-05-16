import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { PostTemplateDto } from '@gitroom/nestjs-libraries/dtos/post-templates/post.templates.dto';

@Injectable()
export class PostTemplatesRepository {
  constructor(private _postTemplate: PrismaRepository<'postTemplate'>) {}

  list(orgId: string) {
    return this._postTemplate.model.postTemplate.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
      },
      include: {
        previewMedia: {
          select: {
            id: true,
            path: true,
            originalName: true,
            thumbnail: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  get(orgId: string, id: string) {
    return this._postTemplate.model.postTemplate.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
      include: {
        previewMedia: {
          select: {
            id: true,
            path: true,
            originalName: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  create(orgId: string, body: PostTemplateDto) {
    return this._postTemplate.model.postTemplate.create({
      data: {
        organizationId: orgId,
        name: body.name,
        type: body.type,
        config: body.config,
        previewMediaId: body.previewMediaId || null,
      },
      include: {
        previewMedia: {
          select: {
            id: true,
            path: true,
            originalName: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  update(orgId: string, id: string, body: PostTemplateDto) {
    return this._postTemplate.model.postTemplate.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        name: body.name,
        type: body.type,
        config: body.config,
        previewMediaId: body.previewMediaId || null,
      },
      include: {
        previewMedia: {
          select: {
            id: true,
            path: true,
            originalName: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  delete(orgId: string, id: string) {
    return this._postTemplate.model.postTemplate.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
