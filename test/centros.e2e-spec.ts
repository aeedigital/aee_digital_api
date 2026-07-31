import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CentrosController } from '../src/centros/centros.controller';
import { CentrosAppService } from '../src/application/centros/centros.service';
import { LocationUpdateTokenGuard } from '../src/centros/location/location-update-token.guard';

describe('CentrosController (e2e)', () => {
  let app: INestApplication;
  const originalLocationToken = process.env.LOCATION_UPDATE_TOKEN;
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

  beforeAll(async () => {
    process.env.LOCATION_UPDATE_TOKEN = 'test-location-token';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CentrosController],
      providers: [
        { provide: CentrosAppService, useValue: service },
        LocationUpdateTokenGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (originalLocationToken === undefined) {
      delete process.env.LOCATION_UPDATE_TOKEN;
    } else {
      process.env.LOCATION_UPDATE_TOKEN = originalLocationToken;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid payload', () => {
    return request(app.getHttpServer()).post('/centros').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.create.mockResolvedValue({ id: 'c1' });
    return request(app.getHttpServer())
      .post('/centros')
      .send({
        FUNCIONAMENTO: {
          segunda: 'x',
          terca: 'x',
          quarta: 'x',
          quinta: 'x',
          sexta: 'x',
          sabado: 'x',
          domingo: 'x',
        },
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
        STATUS: 'ATIVO',
      })
      .expect(201);
  });

  it('lists centros', () => {
    service.findAll.mockResolvedValue([{ id: 'c1' }]);
    return request(app.getHttpServer()).get('/centros').expect(200);
  });

  it('protects and accepts an operational location update', async () => {
    const payload = {
      ENDERECO_HASH: 'a'.repeat(64),
      STATUS: 'CONFIRMADA',
      LATITUDE: -23,
      LONGITUDE: -46,
    };

    await request(app.getHttpServer())
      .put('/centros/c1/localizacao')
      .send(payload)
      .expect(401);

    service.saveLocation.mockResolvedValue({
      id: 'c1',
      location: {
        status: 'CONFIRMADA',
        latitude: -23,
        longitude: -46,
      },
    });
    await request(app.getHttpServer())
      .put('/centros/c1/localizacao')
      .set('x-location-update-token', 'test-location-token')
      .send(payload)
      .expect(200)
      .expect(({ body }) => {
        expect(body.LOCALIZACAO).toEqual({
          LATITUDE: -23,
          LONGITUDE: -46,
          STATUS: 'CONFIRMADA',
        });
      });
  });
});
