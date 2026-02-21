import { NotFoundException } from '@nestjs/common';
import { SummaryAppService } from './summary.service';
import { SummaryRepository } from '../../domain/repositories/summary.repository';
import { Summary } from '../../domain/entities/summary';

describe('SummaryAppService', () => {
  let service: SummaryAppService;
  let repository: jest.Mocked<SummaryRepository>;

  const summary: Summary = {
    id: 's1',
    formId: 'f1',
    centroId: 'c1',
    questions: [{ answer: 'yes', questionId: 'q1' }],
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
    service = new SummaryAppService(repository);
  });

  it('creates a summary', async () => {
    repository.create.mockResolvedValue(summary);
    await expect(service.create(summary)).resolves.toEqual(summary);
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
