import { Test, TestingModule } from '@nestjs/testing';
import { AnswersController } from './answers.controller';
import { AnswersAppService } from '../application/answers/answers.service';

describe('AnswersController', () => {
  let controller: AnswersController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateOrCreate: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswersController],
      providers: [
        {
          provide: AnswersAppService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AnswersController>(AnswersController);
    jest.clearAllMocks();
  });

  it('maps create payload to service input', async () => {
    service.create.mockResolvedValue({
      id: 'a1',
      questionId: 'q1',
      centroId: 'c1',
      answer: 'yes',
    });

    await controller.create({
      QUESTION_ID: 'q1',
      CENTRO_ID: 'c1',
      ANSWER: 'yes',
      QUIZ_ID: 'quiz1',
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      questionId: 'q1',
      centroId: 'c1',
      answer: 'yes',
      quizId: 'quiz1',
    });
  });

  it('maps filters for list', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({
      QUESTION_ID: 'q1',
      CENTRO_ID: 'c1',
      ANSWER: 'yes',
      fields: 'ANSWER',
    } as any);

    expect(service.findAll).toHaveBeenCalledWith({
      questionId: 'q1',
      centroId: 'c1',
      answer: 'yes',
      fields: 'ANSWER',
    });
  });

  it('maps updateOrCreate query filters', async () => {
    service.updateOrCreate.mockResolvedValue({
      id: 'a1',
      questionId: 'q1',
      centroId: 'c1',
      answer: 'yes',
    });

    await controller.updateOrCreate(
      {
        QUESTION_ID: 'q1',
        CENTRO_ID: 'c1',
        ANSWER: 'yes',
      } as any,
      'c1',
      'q1',
      'a1',
    );

    expect(service.updateOrCreate).toHaveBeenCalledWith(
      {
        centroId: 'c1',
        questionId: 'q1',
        id: 'a1',
      },
      {
        questionId: 'q1',
        centroId: 'c1',
        answer: 'yes',
        quizId: undefined,
      },
    );
  });
});
