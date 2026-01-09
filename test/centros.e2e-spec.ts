import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CentrosController } from '../src/centros/centros.controller';
import { CentrosAppService } from '../src/application/centros/centros.service';

describe('CentrosController (e2e)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateOrCreate: jest.fn(),
    delete: jest.fn(),
    findSummaries: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CentrosController],
      providers: [{ provide: CentrosAppService, useValue: service }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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
      })
      .expect(201);
  });

  it('lists centros', () => {
    service.findAll.mockResolvedValue([{ id: 'c1' }]);
    return request(app.getHttpServer()).get('/centros').expect(200);
  });
});
