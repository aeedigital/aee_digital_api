import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { QuestionsController } from '../src/questions/questions.controller';
import { QuestionsAppService } from '../src/application/questions/questions.service';

describe('QuestionsController (e2e)', () => {
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
      controllers: [QuestionsController],
      providers: [{ provide: QuestionsAppService, useValue: service }],
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
    return request(app.getHttpServer()).post('/questions').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.create.mockResolvedValue({ id: 'q1' });
    return request(app.getHttpServer())
      .post('/questions')
      .send({
        QUESTION: 'Pergunta?',
        ANSWER_TYPE: 'text',
        IS_REQUIRED: true,
        IS_MULTIPLE: false,
        PRESET_VALUES: ['a'],
        ROLE: 'admin',
      })
      .expect(201);
  });

  it('lists questions', () => {
    service.findAll.mockResolvedValue([{ id: 'q1' }]);
    return request(app.getHttpServer()).get('/questions').expect(200);
  });
});
