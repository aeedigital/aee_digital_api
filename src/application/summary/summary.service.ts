import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  CENTRO_REPOSITORY,
  FORM_REPOSITORY,
} from '../../domain/repositories/repository.tokens';
import { AnswerRepository } from '../../domain/repositories/answer.repository';
import { FormRepository } from '../../domain/repositories/form.repository';
import { CentroRepository } from '../../domain/repositories/centro.repository';
import {
  buildFormSnapshot,
  deriveAttendance,
  derivePublicationAuthorization,
  flattenSnapshot,
} from './summary.snapshot';
import { CadastroInfoAppService } from '../cadastro-info/cadastro-info.service';
import { DashboardProjectionEventsService } from '../../dashboard-projections/dashboard-projection-events.service';
import { SummaryRefreshPublisher } from '../../infra/aws/summary-refresh.publisher';
import { SummaryRefreshEvent } from '../../summary-updates/summary-refresh.event';

@Injectable()
export class SummaryAppService {
  private readonly logger = new Logger(SummaryAppService.name);

  constructor(
    @Inject(SUMMARY_REPOSITORY)
    private readonly repository: SummaryRepository,
    @Inject(FORM_REPOSITORY)
    private readonly formsRepository: FormRepository,
    @Inject(ANSWER_REPOSITORY)
    private readonly answersRepository: AnswerRepository,
    @Inject(CENTRO_REPOSITORY)
    private readonly centrosRepository: CentroRepository,
    private readonly cadastroInfo: CadastroInfoAppService,
    private readonly projectionEvents: DashboardProjectionEventsService,
    private readonly summaryRefreshPublisher: SummaryRefreshPublisher,
  ) {}

  async create(data: CreateSummaryInput): Promise<Summary> {
    const form = await this.formsRepository.findById(data.formId);
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    const answers = await this.answersRepository.findAll({ centroId: data.centroId });
    const formSnapshot = buildFormSnapshot(form, answers);
    const created = await this.repository.create({
      ...data,
      schemaVersion: 2,
      formSnapshot,
      questions: flattenSnapshot(formSnapshot),
      attendance: deriveAttendance(formSnapshot),
      publicationAuthorized: derivePublicationAuthorization(formSnapshot),
    });

    await this.publishCenterFinished(created);
    await this.publishCenterRefresh(created);
    return created;
  }

  private async publishCenterRefresh(summary: Summary): Promise<void> {
    if (process.env.SUMMARY_CENTER_REFRESH_ENABLED !== 'true') return;

    const fallbackTimestamp =
      summary.updatedAt || summary.createdAt || new Date(0);
    const event: SummaryRefreshEvent = {
      schemaVersion: 'center.summary-refresh.v1',
      eventId: `center-summary-refresh-${summary.id}`,
      summaryId: summary.id,
      centroId: summary.centroId,
      sourceVersion: {
        updatedAt: (summary.updatedAt || summary.createdAt || fallbackTimestamp).toISOString(),
        createdAt: (summary.createdAt || summary.updatedAt || fallbackTimestamp).toISOString(),
        summaryId: summary.id,
      },
    };

    try {
      await this.summaryRefreshPublisher.publish(event);
    } catch (error) {
      this.logger.error(
        `Summary ${summary.id} for center ${summary.centroId} was saved, but its center refresh event could not be published`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async publishCenterFinished(summary: Summary): Promise<void> {
    try {
      const [centro, activeCycle] = await Promise.all([
        this.centrosRepository.findById(summary.centroId),
        this.cadastroInfo.findActive(),
      ]);
      if (!centro) {
        throw new Error(`Center ${summary.centroId} not found`);
      }

      const occurredAt = summary.updatedAt || summary.createdAt || new Date();
      await this.projectionEvents.publishCenterFinished({
        schemaVersion: 'center.finished.v1',
        eventId: `summary-${summary.id}`,
        centerId: summary.centroId,
        regionId: centro.regional,
        cycleId: activeCycle.cycleId,
        logicalVersion: Math.max(1, occurredAt.getTime()),
        occurredAt: occurredAt.toISOString(),
        responded: true,
        finished: true,
        activityDate: occurredAt.toISOString().slice(0, 10),
        activityCount: 1,
      });
    } catch (error) {
      this.logger.error(
        `Summary ${summary.id} was saved, but its projection event could not be queued`,
        error instanceof Error ? error.stack : String(error),
      );
    }
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
