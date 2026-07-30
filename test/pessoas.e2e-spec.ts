import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PessoasController } from '../src/pessoas/pessoas.controller';
import { PessoasAppService } from '../src/application/pessoas/pessoas.service';

describe('PessoasController (e2e)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateOrCreate: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PessoasController],
      providers: [{ provide: PessoasAppService, useValue: service }],
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
    return request(app.getHttpServer()).post('/pessoas').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.create.mockResolvedValue({ id: 'p1' });
    return request(app.getHttpServer())
      .post('/pessoas')
      .send({ NOME: 'Pessoa', 'E-MAIL': 'p@test.com', CELULAR: '9999' })
      .expect(201);
  });

  it('lists pessoas', () => {
    service.findAll.mockResolvedValue([{ id: 'p1' }]);
    return request(app.getHttpServer()).get('/pessoas').expect(200);
  });
});
