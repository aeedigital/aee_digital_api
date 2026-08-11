import { NotFoundException } from '@nestjs/common';
import { RegionaisAppService } from './regionais.service';
import { RegionalRepository } from '../../domain/repositories/regional.repository';
import { CentrosAppService } from '../centros/centros.service';
import { SummaryAppService } from '../summary/summary.service';
import { PessoasAppService } from '../pessoas/pessoas.service';
import { FormsAppService } from '../forms/forms.service';
import { AnswersAppService } from '../answers/answers.service';
import { Regional } from '../../domain/entities/regional';

describe('RegionaisAppService', () => {
  let service: RegionaisAppService;
  let repository: jest.Mocked<RegionalRepository>;
  let centrosService: jest.Mocked<CentrosAppService>;
  let summaryService: jest.Mocked<SummaryAppService>;
  let pessoasService: jest.Mocked<PessoasAppService>;
  let formsService: jest.Mocked<FormsAppService>;
  let answersService: jest.Mocked<AnswersAppService>;
  let projectionsService: { query: jest.Mock; queryRegions: jest.Mock };
  let cadastroInfoService: { findActive: jest.Mock };

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
      overview: jest.fn(),
      overviewBase: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<RegionalRepository>;
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
      stats: jest.fn(),
      findByCentroIds: jest.fn(),
      findLatestByCentroIds: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as any;
    pessoasService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByIds: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as any;
    formsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as any;
    answersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByCentroIds: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as any;
    projectionsService = { query: jest.fn(), queryRegions: jest.fn() };
    cadastroInfoService = { findActive: jest.fn() };
    service = new RegionaisAppService(
      repository,
      centrosService,
      summaryService,
      pessoasService,
      formsService,
      answersService,
      projectionsService as any,
      cadastroInfoService as any,
    );
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

  it('delegates overview to repository', async () => {
    repository.overview.mockResolvedValue([]);
    await expect(service.overview({})).resolves.toEqual([]);
  });

  it('merges one batch projection into the overview for the active cycle', async () => {
    cadastroInfoService.findActive.mockResolvedValue({
      cycleId: 'cycle-1',
      startDate: '01/01/2026',
      endDate: '31/01/2026',
    });
    repository.overviewBase.mockResolvedValue([
      { id: 'r1', nomeRegional: 'Regional 1', pais: 'BR', centrosCount: 3, finalizadosCount: 0 },
    ]);
    projectionsService.queryRegions.mockResolvedValue({
      schemaVersion: 'projection.query.batch.v1',
      items: [{ scopeId: 'r1', found: true, totals: { finishedCenters: 2 } }],
    });

    await expect(service.overview({
      dateFrom: new Date('2026-01-01T00:00:00Z'),
      dateTo: new Date('2026-01-31T00:00:00Z'),
    })).resolves.toEqual([
      { id: 'r1', nomeRegional: 'Regional 1', pais: 'BR', centrosCount: 3, finalizadosCount: 2 },
    ]);
    expect(projectionsService.queryRegions).toHaveBeenCalledTimes(1);
    expect(repository.overview).not.toHaveBeenCalled();
  });

  it('applies sortBy=updatedAt:desc in centros-with-answers dependencies', async () => {
    centrosService.findAll.mockResolvedValue([{ id: 'c1' } as any]);
    summaryService.findLatestByCentroIds.mockResolvedValue([{ id: 's1', centroId: 'c1' } as any]);
    answersService.findByCentroIds.mockResolvedValue([{ id: 'a1', centroId: 'c1' } as any]);

    await expect(
      service.centrosWithAnswers('r1', {
        includeAnswers: true,
        includeSummaries: true,
        limitSummaries: 1,
        sortBy: 'updatedAt:desc',
      }),
    ).resolves.toEqual({
      regionalId: 'r1',
      totals: { totalCentros: 1, totalRespostas: 1, updatedAt: undefined },
      centros: [
        {
          centro: { id: 'c1' },
          answers: [{ id: 'a1', centroId: 'c1' }],
          summaries: [{ id: 's1', centroId: 'c1' }],
        },
      ],
    });

    expect(centrosService.findAll).toHaveBeenCalledWith({
      regional: 'r1',
      fields: undefined,
      sortBy: 'updatedAt:desc',
    });
    expect(summaryService.findLatestByCentroIds).toHaveBeenCalledWith({
      centroIds: ['c1'],
      dateFrom: undefined,
      dateTo: undefined,
      fields: 'FORM_ID,CENTRO_ID,validatedByCoordAt,createdAt,updatedAt',
    });
    expect(answersService.findByCentroIds).toHaveBeenCalledWith({
      centroIds: ['c1'],
      sortByUpdatedAt: true,
    });
  });
});
