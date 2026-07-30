import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PassesController } from '../src/passes/passes.controller';
import { PassesAppService } from '../src/application/passes/passes.service';

describe('PassesController (e2e)', () => {
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
      controllers: [PassesController],
      providers: [{ provide: PassesAppService, useValue: service }],
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
    return request(app.getHttpServer()).post('/passes').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.create.mockResolvedValue({ id: 'p1' });
    return request(app.getHttpServer())
      .post('/passes')
      .send({
        user: 'user',
        pass: 'secret',
        scope_id: 'scope',
        groups: ['g1'],
        lastLogged: new Date().toISOString(),
      })
      .expect(201);
  });

  it('lists passes', () => {
    service.findAll.mockResolvedValue([{ id: 'p1' }]);
    return request(app.getHttpServer()).get('/passes').expect(200);
  });
});
