import { NotFoundException } from '@nestjs/common';
import { SummaryAppService } from './summary.service';
import { SummaryRepository } from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';
import { FormRepository } from '../../domain/repositories/form.repository';
import { AnswerRepository } from '../../domain/repositories/answer.repository';
import { CentroRepository } from '../../domain/repositories/centro.repository';
import { CadastroInfoAppService } from '../cadastro-info/cadastro-info.service';
import { DashboardProjectionEventsService } from '../../dashboard-projections/dashboard-projection-events.service';

describe('SummaryAppService', () => {
  let service: SummaryAppService;
  let repository: jest.Mocked<SummaryRepository>;
  let formsRepository: jest.Mocked<FormRepository>;
  let answersRepository: jest.Mocked<AnswerRepository>;
  let centrosRepository: jest.Mocked<CentroRepository>;
  let cadastroInfo: { findActive: jest.Mock };
  let projectionEvents: { publishCenterFinished: jest.Mock };
  let summaryRefreshPublisher: { publishSummaryRefresh: jest.Mock };
  const originalRefreshEnabled = process.env.SUMMARY_CENTER_REFRESH_ENABLED;

  const summary: Summary = {
    id: 's1',
    formId: 'f1',
    centroId: 'c1',
    questions: [{ answer: 'yes', questionId: 'q1' }],
    createdAt: new Date('2026-08-12T10:00:00.000Z'),
    updatedAt: new Date('2026-08-12T10:00:01.000Z'),
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      stats: jest.fn(),
      findByCentroIds: jest.fn(),
      findLatestByCentroIds: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<SummaryRepository>;
    formsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<FormRepository>;
    answersRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByCentroIds: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<AnswerRepository>;
    centrosRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'c1', regional: 'r1' }),
    } as unknown as jest.Mocked<CentroRepository>;
    cadastroInfo = {
      findActive: jest.fn().mockResolvedValue({ cycleId: 'cycle-1' }),
    };
    projectionEvents = {
      publishCenterFinished: jest.fn().mockResolvedValue(undefined),
    };
    summaryRefreshPublisher = {
      publishSummaryRefresh: jest.fn().mockResolvedValue(undefined),
    };
    service = new SummaryAppService(
      repository,
      formsRepository,
      answersRepository,
      centrosRepository,
      cadastroInfo as unknown as CadastroInfoAppService,
      projectionEvents as unknown as DashboardProjectionEventsService,
    );
    Object.defineProperty(service, 'summaryRefreshPublisher', {
      value: summaryRefreshPublisher,
      configurable: true,
    });
    delete process.env.SUMMARY_CENTER_REFRESH_ENABLED;
  });

  afterEach(() => {
    if (originalRefreshEnabled === undefined) {
      delete process.env.SUMMARY_CENTER_REFRESH_ENABLED;
    } else {
      process.env.SUMMARY_CENTER_REFRESH_ENABLED = originalRefreshEnabled;
    }
  });

  it('creates a summary', async () => {
    formsRepository.findById.mockResolvedValue({
      id: 'f1', name: 'Form', version: 1, createdBy: 'u1', pages: [],
    });
    answersRepository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue(summary);
    await expect(service.create(summary)).resolves.toEqual(summary);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ schemaVersion: 2, questions: [] }),
    );
    expect(projectionEvents.publishCenterFinished).toHaveBeenCalledWith({
      schemaVersion: 'center.finished.v1',
      eventId: 'summary-s1',
      centerId: 'c1',
      regionId: 'r1',
      cycleId: 'cycle-1',
      logicalVersion: 1786528801000,
      occurredAt: '2026-08-12T10:00:01.000Z',
      responded: true,
      finished: true,
      activityDate: '2026-08-12',
      activityCount: 1,
    });
  });

  it('keeps the saved summary when the projection event cannot be queued', async () => {
    formsRepository.findById.mockResolvedValue({
      id: 'f1', name: 'Form', version: 1, createdBy: 'u1', pages: [],
    });
    answersRepository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue(summary);
    projectionEvents.publishCenterFinished.mockRejectedValue(new Error('SQS unavailable'));
    jest.spyOn((service as any).logger, 'error').mockImplementation();

    await expect(service.create(summary)).resolves.toEqual(summary);
  });

  it('publishes the center refresh event after persistence when enabled', async () => {
    process.env.SUMMARY_CENTER_REFRESH_ENABLED = 'true';
    formsRepository.findById.mockResolvedValue({
      id: 'f1', name: 'Form', version: 1, createdBy: 'u1', pages: [],
    });
    answersRepository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue(summary);

    await expect(service.create(summary)).resolves.toEqual(summary);

    expect(repository.create.mock.invocationCallOrder[0]).toBeLessThan(
      summaryRefreshPublisher.publishSummaryRefresh.mock.invocationCallOrder[0],
    );
    expect(summaryRefreshPublisher.publishSummaryRefresh).toHaveBeenCalledWith({
      schemaVersion: 'center.summary-refresh.v1',
      eventId: 'center-summary-refresh-s1',
      summaryId: 's1',
      centroId: 'c1',
      sourceVersion: {
        updatedAt: '2026-08-12T10:00:01.000Z',
        createdAt: '2026-08-12T10:00:00.000Z',
        summaryId: 's1',
      },
    });
    expect(projectionEvents.publishCenterFinished).toHaveBeenCalled();
  });

  it('does not publish the center refresh event by default', async () => {
    formsRepository.findById.mockResolvedValue({
      id: 'f1', name: 'Form', version: 1, createdBy: 'u1', pages: [],
    });
    answersRepository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue(summary);

    await expect(service.create(summary)).resolves.toEqual(summary);

    expect(summaryRefreshPublisher.publishSummaryRefresh).not.toHaveBeenCalled();
  });

  it('logs IDs and propagates center refresh publication failures after saving', async () => {
    process.env.SUMMARY_CENTER_REFRESH_ENABLED = 'true';
    formsRepository.findById.mockResolvedValue({
      id: 'f1', name: 'Form', version: 1, createdBy: 'u1', pages: [],
    });
    answersRepository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue(summary);
    summaryRefreshPublisher.publishSummaryRefresh.mockRejectedValue(
      new Error('SNS unavailable'),
    );
    const logError = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();

    await expect(service.create(summary)).rejects.toThrow('SNS unavailable');

    expect(repository.create).toHaveBeenCalled();
    expect(projectionEvents.publishCenterFinished).toHaveBeenCalled();
    const [message] = logError.mock.calls[0]!;
    expect(message).toContain('s1');
    expect(message).toContain('c1');
  });

  it('finds all summaries', async () => {
    repository.findAll.mockResolvedValue([summary]);
    await expect(service.findAll({ formId: 'f1' })).resolves.toEqual([summary]);
  });

  it('finds one summary', async () => {
    repository.findById.mockResolvedValue(summary);
    await expect(service.findOne('s1')).resolves.toEqual(summary);
  });

  it('throws when summary not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a summary', async () => {
    repository.update.mockResolvedValue(summary);
    await expect(service.update('s1', { validatedByCoordAt: new Date() })).resolves.toEqual(summary);
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(summary);
    await expect(service.updateOrCreate({ id: 's1' }, summary)).resolves.toEqual(summary);
  });

  it('deletes a summary', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('s1')).resolves.toBeUndefined();
  });

  it('delegates stats to repository', async () => {
    const response = { eventsByDay: {}, respondedCount: 0, totalCentros: 0 };
    repository.stats.mockResolvedValue(response);
    await expect(
      service.stats({ dateFrom: new Date('2026-01-01'), dateTo: new Date('2026-01-31') }),
    ).resolves.toEqual(response);
  });

  it('delegates findByCentroIds to repository', async () => {
    repository.findByCentroIds.mockResolvedValue([summary]);
    await expect(service.findByCentroIds({ centroIds: ['c1'] })).resolves.toEqual([summary]);
  });

  it('delegates findLatestByCentroIds to repository', async () => {
    repository.findLatestByCentroIds.mockResolvedValue([summary]);
    await expect(service.findLatestByCentroIds({ centroIds: ['c1'] })).resolves.toEqual([
      summary,
    ]);
  });
});
