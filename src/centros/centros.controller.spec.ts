import { Test, TestingModule } from '@nestjs/testing';
import { CentrosController } from './centros.controller';
import { CentrosAppService } from '../application/centros/centros.service';

describe('CentrosController', () => {
  let controller: CentrosController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateOrCreate: jest.fn(),
    delete: jest.fn(),
    findSummaries: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentrosController],
      providers: [{ provide: CentrosAppService, useValue: service }],
    }).compile();

    controller = module.get<CentrosController>(CentrosController);
    jest.clearAllMocks();
  });

  it('maps create payload', async () => {
    service.create.mockResolvedValue({ id: 'c1' });
    await controller.create({
      FUNCIONAMENTO: {},
      NOME_CENTRO: 'Centro',
      NOME_CURTO: 'C',
      CNPJ_CENTRO: '123',
      DATA_FUNDACAO: '01/01/2020',
      REGIONAL: 'r1',
      ENDERECO: 'Rua',
      CEP: '000',
      BAIRRO: 'B',
      CIDADE: 'C',
      ESTADO: 'E',
      PAIS: 'BR',
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      funcionamento: {},
      nomeCentro: 'Centro',
      nomeCurto: 'C',
      cnpjCentro: '123',
      dataFundacao: '01/01/2020',
      regional: 'r1',
      endereco: 'Rua',
      cep: '000',
      bairro: 'B',
      cidade: 'C',
      estado: 'E',
      pais: 'BR',
    });
  });

  it('maps filters for list', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ NOME_CENTRO: 'Centro', fields: 'NOME_CENTRO' } as any);
    expect(service.findAll).toHaveBeenCalledWith({
      nomeCentro: 'Centro',
      fields: 'NOME_CENTRO',
    });
  });

  it('maps summaries filter', async () => {
    service.findSummaries.mockResolvedValue([]);
    await controller.findSummaries('c1', { FORM_ID: 'f1' } as any);
    expect(service.findSummaries).toHaveBeenCalledWith('c1', { formId: 'f1' });
  });
});
