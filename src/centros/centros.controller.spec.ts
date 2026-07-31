import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CentrosController } from './centros.controller';
import { CentrosAppService } from '../application/centros/centros.service';
import { UpdateCentroDto } from './dto/update-centro.dto';
import { SaveCentroLocationDto } from './dto/save-centro-location.dto';

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
    saveLocation: jest.fn(),
  };
  const strictPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentrosController],
      providers: [{ provide: CentrosAppService, useValue: service }],
    }).compile();
    controller = module.get(CentrosController);
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

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nomeCentro: 'Centro',
        endereco: 'Rua',
        cidade: 'C',
      }),
    );
  });

  it('maps a partial update payload', async () => {
    service.update.mockResolvedValue({ id: 'c1', endereco: 'Rua Nova' });
    await controller.update('c1', { ENDERECO: 'Rua Nova' });
    expect(service.update).toHaveBeenCalledWith('c1', {
      endereco: 'Rua Nova',
    });
  });

  it('rejects client-controlled location fields', async () => {
    await expect(
      strictPipe.transform(
        {
          ENDERECO: 'Rua Nova, 10',
          LOCALIZACAO: { LATITUDE: -23, LONGITUDE: -46 },
        },
        { type: 'body', metatype: UpdateCentroDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('maps operational location persistence', async () => {
    service.saveLocation.mockResolvedValue({
      id: 'c1',
      location: { status: 'CONFIRMADA' },
    });
    const payload = {
      ENDERECO_HASH: 'a'.repeat(64),
      STATUS: 'CONFIRMADA' as const,
      LATITUDE: -23,
      LONGITUDE: -46,
    };

    await controller.saveLocation('c1', payload);
    expect(service.saveLocation).toHaveBeenCalledWith('c1', {
      addressHash: 'a'.repeat(64),
      status: 'CONFIRMADA',
      latitude: -23,
      longitude: -46,
      precision: undefined,
      confidence: undefined,
      origin: undefined,
      placeId: undefined,
      formattedAddress: undefined,
      errorCode: undefined,
    });
  });

  it('validates the operational location payload', async () => {
    await expect(
      strictPipe.transform(
        {
          ENDERECO_HASH: 'a'.repeat(64),
          STATUS: 'CONFIRMADA',
          LATITUDE: 91,
          LONGITUDE: -46,
        },
        { type: 'body', metatype: SaveCentroLocationDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
