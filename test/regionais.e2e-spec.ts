import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { RegionaisController } from '../src/regionais/regionais.controller';
import { RegionaisAppService } from '../src/application/regionais/regionais.service';

describe('RegionaisController (e2e)', () => {
  let app: INestApplication;
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
    coordSummary: jest.fn(),
    centrosWithAnswers: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RegionaisController],
      providers: [{ provide: RegionaisAppService, useValue: service }],
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
    return request(app.getHttpServer()).post('/regionais').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.create.mockResolvedValue({ id: 'r1' });
    return request(app.getHttpServer())
      .post('/regionais')
      .send({ NOME_REGIONAL: 'Regional', PAIS: 'BR', COORDENADOR_ID: 'c1' })
      .expect(201);
  });

  it('lists regionais', () => {
    service.findAll.mockResolvedValue([{ id: 'r1' }]);
    return request(app.getHttpServer()).get('/regionais').expect(200);
  });

  it('accepts overview with default exclusion flag', () => {
    service.overview.mockResolvedValue([]);
    return request(app.getHttpServer())
      .get('/regionais/overview?applyDefaultExclusion=true')
      .expect(200);
  });

  it('rejects overview with incomplete custom exclusion params', () => {
    return request(app.getHttpServer())
      .get('/regionais/overview?excludeQuestionId=61ec11fe69001e0012bc299a')
      .expect(400);
  });

  it('accepts centros-with-answers with encoded sortBy param', async () => {
    service.centrosWithAnswers.mockResolvedValue({ regionalId: 'r1', centros: [] });

    await request(app.getHttpServer())
      .get('/regionais/r1/centros-with-answers?sortBy=updatedAt%3Adesc&')
      .expect(200);

    expect(service.centrosWithAnswers).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({
        sortBy: 'updatedAt:desc',
      }),
    );
  });
});
