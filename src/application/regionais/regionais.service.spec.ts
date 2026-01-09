import { NotFoundException } from '@nestjs/common';
import { RegionaisAppService } from './regionais.service';
import { RegionalRepository } from '../../domain/repositories/regional.repository';
import { CentrosAppService } from '../centros/centros.service';
import { SummaryAppService } from '../summary/summary.service';
import { Regional } from '../../domain/entities/regional';

describe('RegionaisAppService', () => {
  let service: RegionaisAppService;
  let repository: jest.Mocked<RegionalRepository>;
  let centrosService: jest.Mocked<CentrosAppService>;
  let summaryService: jest.Mocked<SummaryAppService>;

  const regional: Regional = {
    id: 'r1',
    nomeRegional: 'Regional 1',
    pais: 'BR',
    coordenadorId: 'coord',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    };
    centrosService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
      findSummaries: jest.fn(),
    } as any;
    summaryService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new RegionaisAppService(repository, centrosService, summaryService);
  });

  it('creates a regional', async () => {
    repository.create.mockResolvedValue(regional);
    await expect(service.create(regional)).resolves.toEqual(regional);
  });

  it('finds all regionais', async () => {
    repository.findAll.mockResolvedValue([regional]);
    await expect(service.findAll({ pais: 'BR' })).resolves.toEqual([regional]);
  });

  it('finds one regional', async () => {
    repository.findById.mockResolvedValue(regional);
    await expect(service.findOne('r1')).resolves.toEqual(regional);
  });

  it('throws when regional not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a regional', async () => {
    repository.update.mockResolvedValue(regional);
    await expect(service.update('r1', { pais: 'AR' })).resolves.toEqual(regional);
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(regional);
    await expect(service.updateOrCreate({ id: 'r1' }, regional)).resolves.toEqual(regional);
  });

  it('deletes a regional', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('r1')).resolves.toBeUndefined();
  });

  it('finds centros for regional', async () => {
    centrosService.findAll.mockResolvedValue([]);
    await expect(service.findCentros('r1', { cidade: 'X' } as any)).resolves.toEqual([]);
    expect(centrosService.findAll).toHaveBeenCalledWith({ cidade: 'X', regional: 'r1' });
  });

  it('finds summaries for regional', async () => {
    centrosService.findAll.mockResolvedValue([{ id: 'c1' } as any, { id: 'c2' } as any]);
    summaryService.findAll.mockResolvedValueOnce([{ id: 's1' } as any]).mockResolvedValueOnce([]);
    await expect(service.findSummaries('r1', { formId: 'f1' })).resolves.toEqual([
      { id: 's1' },
    ]);
    expect(summaryService.findAll).toHaveBeenCalledTimes(2);
  });
});
