import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AnswersController } from '../src/answers/answers.controller';
import { AnswersAppService } from '../src/application/answers/answers.service';

describe('AnswersController (e2e)', () => {
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
      controllers: [AnswersController],
      providers: [
        {
          provide: AnswersAppService,
          useValue: service,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid payload', () => {
    return request(app.getHttpServer())
      .post('/answers')
      .send({ CENTRO_ID: 'c1' })
      .expect(400);
  });

  it('accepts valid payload and returns created answer', () => {
    service.create.mockResolvedValue({
      id: 'a1',
      questionId: 'q1',
      centroId: 'c1',
      answer: 'yes',
      quizId: 'quiz1',
    });

    return request(app.getHttpServer())
      .post('/answers')
      .send({
        QUESTION_ID: 'q1',
        CENTRO_ID: 'c1',
        ANSWER: 'yes',
        QUIZ_ID: 'quiz1',
      })
      .expect(201)
      .expect({
        id: 'a1',
        questionId: 'q1',
        centroId: 'c1',
        answer: 'yes',
        quizId: 'quiz1',
      });
  });

  it('lists answers with filters', () => {
    service.findAll.mockResolvedValue([
      {
        id: 'a1',
        questionId: 'q1',
        centroId: 'c1',
        answer: 'yes',
      },
    ]);

    return request(app.getHttpServer())
      .get('/answers')
      .query({ QUESTION_ID: 'q1', CENTRO_ID: 'c1' })
      .expect(200)
      .expect([
        {
          id: 'a1',
          questionId: 'q1',
          centroId: 'c1',
          answer: 'yes',
        },
      ]);
  });
});
