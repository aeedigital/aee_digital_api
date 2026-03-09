import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RegionaisController } from './regionais.controller';
import { RegionaisAppService } from '../application/regionais/regionais.service';
import { OVERVIEW_DEFAULT_EXCLUDE_RULE } from '../application/regionais/constants/overview-exclusion.constants';

describe('RegionaisController', () => {
  let controller: RegionaisController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateOrCreate: jest.fn(),
    delete: jest.fn(),
    findSummaries: jest.fn(),
    findCentros: jest.fn(),
    overview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionaisController],
      providers: [{ provide: RegionaisAppService, useValue: service }],
    }).compile();

    controller = module.get<RegionaisController>(RegionaisController);
    jest.clearAllMocks();
  });

  it('maps create payload', async () => {
    service.create.mockResolvedValue({ id: 'r1' });
    await controller.create({
      NOME_REGIONAL: 'Regional',
      PAIS: 'BR',
      COORDENADOR_ID: 'c1',
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      nomeRegional: 'Regional',
      pais: 'BR',
      coordenadorId: 'c1',
    });
  });

  it('maps filters for list', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ NOME_REGIONAL: 'Regional', fields: 'NOME_REGIONAL' } as any);
    expect(service.findAll).toHaveBeenCalledWith({
      nomeRegional: 'Regional',
      fields: 'NOME_REGIONAL',
    });
  });

  it('maps summaries filters', async () => {
    service.findSummaries.mockResolvedValue([]);
    await controller.findSummaries('r1', { FORM_ID: 'f1' } as any);
    expect(service.findSummaries).toHaveBeenCalledWith('r1', { formId: 'f1' });
  });

  it('maps centros filters', async () => {
    service.findCentros.mockResolvedValue([]);
    await controller.findCentros('r1', { NOME_CENTRO: 'Centro' } as any);
    expect(service.findCentros).toHaveBeenCalledWith('r1', { nomeCentro: 'Centro' });
  });

  it('maps overview without exclusion rule by default', async () => {
    service.overview.mockResolvedValue([]);
    await controller.overview({ dateFrom: '2025-01-01', dateTo: '2025-03-01' } as any);
    expect(service.overview).toHaveBeenCalledWith({
      dateFrom: new Date('2025-01-01'),
      dateTo: new Date('2025-03-01'),
      status: undefined,
      excludeRule: undefined,
    });
  });

  it('maps overview with default exclusion when enabled', async () => {
    service.overview.mockResolvedValue([]);
    await controller.overview({ applyDefaultExclusion: 'true' } as any);
    expect(service.overview).toHaveBeenCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      status: undefined,
      excludeRule: OVERVIEW_DEFAULT_EXCLUDE_RULE,
    });
  });

  it('maps overview with custom exclusion rule', async () => {
    service.overview.mockResolvedValue([]);
    await controller.overview({
      excludeQuestionId: '61ec11fe69001e0012bc299a',
      excludeAnswers: ' Encerrada , desfiliada ',
    } as any);
    expect(service.overview).toHaveBeenCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      status: undefined,
      excludeRule: {
        questionId: '61ec11fe69001e0012bc299a',
        answers: ['Encerrada', 'desfiliada'],
        summarySelection: 'latest',
        matchMode: 'trim-case-insensitive',
      },
    });
  });

  it('throws bad request when only one custom exclusion field is provided', async () => {
    expect(() => controller.overview({ excludeQuestionId: 'q1' } as any)).toThrow(
      BadRequestException,
    );
    expect(() => controller.overview({ excludeAnswers: 'Encerrada' } as any)).toThrow(
      BadRequestException,
    );
  });

  it('throws bad request when excludeAnswers is empty after parse', async () => {
    expect(() =>
      controller.overview({
        excludeQuestionId: 'q1',
        excludeAnswers: ' ,   ',
      } as any),
    ).toThrow(BadRequestException);
  });
});
