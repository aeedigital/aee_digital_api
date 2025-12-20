import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreatePassInput,
  PassFilter,
  PassRepository,
  UpdatePassInput,
} from '../../domain/repositories/pass.repository';
import { Pass } from '../../domain/entities/pass';
import { PASS_REPOSITORY } from '../../passes/passes.tokens';

@Injectable()
export class PassesAppService {
  constructor(
    @Inject(PASS_REPOSITORY)
    private readonly repository: PassRepository,
  ) {}

  create(data: CreatePassInput): Promise<Pass> {
    return this.repository.create(data);
  }

  findAll(filter?: PassFilter): Promise<Pass[]> {
    return this.repository.findAll(filter);
  }

  async findOne(id: string): Promise<Pass> {
    const pass = await this.repository.findById(id);
    if (!pass) {
      throw new NotFoundException('Pass not found');
    }
    return pass;
  }

  update(id: string, data: UpdatePassInput): Promise<Pass> {
    return this.repository.update(id, data);
  }

  updateOrCreate(
    filter: Partial<PassFilter> & { id?: string },
    data: CreatePassInput,
  ): Promise<Pass> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
