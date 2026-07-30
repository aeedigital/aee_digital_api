import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { SummariesController } from '../src/summary/summary.controller';
import { SummaryAppService } from '../src/application/summary/summary.service';

describe('SummariesController (e2e)', () => {
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
      controllers: [SummariesController],
      providers: [{ provide: SummaryAppService, useValue: service }],
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
    return request(app.getHttpServer()).post('/summaries').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.create.mockResolvedValue({ id: 's1' });
    return request(app.getHttpServer())
      .post('/summaries')
      .send({
        FORM_ID: 'f1',
        CENTRO_ID: 'c1',
        QUESTIONS: [{ ANSWER: 'yes', QUESTION: 'q1' }],
      })
      .expect(201);
  });

  it('lists summaries', () => {
    service.findAll.mockResolvedValue([{ id: 's1' }]);
    return request(app.getHttpServer()).get('/summaries').expect(200);
  });
});
