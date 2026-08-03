import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateSummaryInput,
  SummaryFilter,
  SummaryRepository,
  SummaryStatsParams,
  SummaryStatsResult,
  SummaryManyFilter,
  UpdateSummaryInput,
} from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';
import { SUMMARY_REPOSITORY } from '../../domain/repositories/repository.tokens';
import {
  ANSWER_REPOSITORY,
  FORM_REPOSITORY,
} from '../../domain/repositories/repository.tokens';
import { AnswerRepository } from '../../domain/repositories/answer.repository';
import { FormRepository } from '../../domain/repositories/form.repository';
import {
  buildFormSnapshot,
  deriveAttendance,
  derivePublicationAuthorization,
  flattenSnapshot,
} from './summary.snapshot';

@Injectable()
export class SummaryAppService {
  constructor(
    @Inject(SUMMARY_REPOSITORY)
    private readonly repository: SummaryRepository,
    @Inject(FORM_REPOSITORY)
    private readonly formsRepository: FormRepository,
    @Inject(ANSWER_REPOSITORY)
    private readonly answersRepository: AnswerRepository,
  ) {}

  async create(data: CreateSummaryInput): Promise<Summary> {
    const form = await this.formsRepository.findById(data.formId);
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    const answers = await this.answersRepository.findAll({ centroId: data.centroId });
    const formSnapshot = buildFormSnapshot(form, answers);
    return this.repository.create({
      ...data,
      schemaVersion: 2,
      formSnapshot,
      questions: flattenSnapshot(formSnapshot),
      attendance: deriveAttendance(formSnapshot),
      publicationAuthorized: derivePublicationAuthorization(formSnapshot),
    });
  }

  findAll(filter?: SummaryFilter): Promise<Summary[]> {
    return this.repository.findAll(filter);
  }

  stats(params: SummaryStatsParams): Promise<SummaryStatsResult> {
    return this.repository.stats(params);
  }

  findByCentroIds(filter: SummaryManyFilter): Promise<Summary[]> {
    return this.repository.findByCentroIds(filter);
  }

  findLatestByCentroIds(filter: SummaryManyFilter): Promise<Summary[]> {
    return this.repository.findLatestByCentroIds(filter);
  }

  async findOne(id: string): Promise<Summary> {
    const summary = await this.repository.findById(id);
    if (!summary) {
      throw new NotFoundException('Summary not found');
    }
    return summary;
  }

  update(id: string, data: UpdateSummaryInput): Promise<Summary> {
    return this.repository.update(id, data);
  }

  async validateByCoordinator(id: string): Promise<Summary> {
    const summary = await this.findOne(id);
    const form = await this.formsRepository.findById(summary.formId);
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    const answers = await this.answersRepository.findAll({
      centroId: summary.centroId,
    });
    const currentSnapshot = buildFormSnapshot(form, answers);
    const coordinationSnapshot = {
      ...currentSnapshot,
      pages: currentSnapshot.pages.filter(
        (page) => page.role === 'coord_regional',
      ),
    };
    return this.repository.update(id, {
      coordinationSnapshot,
      validatedByCoordAt: new Date(),
    });
  }

  updateOrCreate(
    filter: Partial<SummaryFilter> & { id?: string },
    data: CreateSummaryInput,
  ): Promise<Summary> {
    return this.repository.updateOrCreate(filter, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
