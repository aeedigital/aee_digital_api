import { Test, TestingModule } from '@nestjs/testing';
import { RegionaisController } from './regionais.controller';
import { RegionaisAppService } from '../application/regionais/regionais.service';

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
});
