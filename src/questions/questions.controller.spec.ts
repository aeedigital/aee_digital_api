import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsAppService } from '../application/questions/questions.service';

describe('QuestionsController', () => {
  let controller: QuestionsController;
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
      controllers: [QuestionsController],
      providers: [{ provide: QuestionsAppService, useValue: service }],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
    jest.clearAllMocks();
  });

  it('maps create payload', async () => {
    service.create.mockResolvedValue({ id: 'q1' });
    await controller.create({
      QUESTION: 'Pergunta?',
      ANSWER_TYPE: 'text',
      IS_REQUIRED: true,
      IS_MULTIPLE: false,
      PRESET_VALUES: ['a'],
      ROLE: 'admin',
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      question: 'Pergunta?',
      answerType: 'text',
      isRequired: true,
      isMultiple: false,
      presetValues: ['a'],
      role: 'admin',
    });
  });

  it('maps filters for list', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ QUESTION: 'Pergunta?', fields: 'QUESTION' } as any);
    expect(service.findAll).toHaveBeenCalledWith({
      question: 'Pergunta?',
      fields: 'QUESTION',
    });
  });

  it('maps a partial update payload', async () => {
    service.update.mockResolvedValue({ id: 'q1', role: 'coord_regional' });

    await controller.update('q1', { ROLE: 'coord_regional' });

    expect(service.update).toHaveBeenCalledWith('q1', {
      role: 'coord_regional',
    });
  });
});
