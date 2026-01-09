import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreatePassInput,
  PassFilter,
  PassRepository,
  UpdatePassInput,
} from '../../domain/repositories/pass.repository';
import { Pass } from '../../domain/entities/pass';
import { PassesDocument } from '../../passes/schemas/passes.schema';
import { CacheService } from '../../services/cache.service';
import { BaseMongoRepository } from './base.mongo.repository';
import { mapProps, omitUndefined } from '../../base/mappers/object.mapper';

@Injectable()
export class PassesMongoRepository
  extends BaseMongoRepository<Pass, CreatePassInput, UpdatePassInput, PassFilter>
  implements PassRepository
{
  constructor(
    @InjectModel('Passes') protected readonly model: Model<PassesDocument>,
    protected readonly cacheService: CacheService,
  ) {
    super(model, cacheService);
  }

  protected toDomain(doc: any): Pass {
    const core: Omit<Pass, 'id' | 'createdAt' | 'updatedAt' | 'lastLogged' | 'groups'> =
      mapProps(doc, {
        user: 'user',
        pass: 'pass',
        scope_id: 'scopeId',
      });
    return {
      id: doc._id?.toString(),
      ...core,
      groups: doc.groups || [],
      lastLogged: doc.lastLogged ? new Date(doc.lastLogged) : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }

  protected buildFilter(filter?: PassFilter): Record<string, any> {
    const query: Record<string, any> = omitUndefined({ ...(filter || {}) });
    if ((query as any).scopeId) {
      query['scope_id'] = (query as any).scopeId;
      delete (query as any).scopeId;
    }
    return query;
  }

  protected toPersistence(data: CreatePassInput | UpdatePassInput): any {
    const payload = mapProps(data as any, {
      user: 'user',
      pass: 'pass',
      scopeId: 'scope_id',
      groups: 'groups',
      lastLogged: 'lastLogged',
    });
    return omitUndefined(payload);
  }

  async update(id: string, data: UpdatePassInput): Promise<Pass> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: this.toPersistence(data) }, { new: true, lean: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Pass not found');
    }
    return this.toDomain(updated);
  }
}
