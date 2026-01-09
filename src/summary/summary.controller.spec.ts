import { Test, TestingModule } from '@nestjs/testing';
import { SummariesController } from './summary.controller';
import { SummaryAppService } from '../application/summary/summary.service';

describe('SummariesController', () => {
  let controller: SummariesController;
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
      controllers: [SummariesController],
      providers: [{ provide: SummaryAppService, useValue: service }],
    }).compile();

    controller = module.get<SummariesController>(SummariesController);
    jest.clearAllMocks();
  });

  it('maps create payload', async () => {
    service.create.mockResolvedValue({ id: 's1' });
    await controller.create({
      FORM_ID: 'f1',
      CENTRO_ID: 'c1',
      QUESTIONS: [{ ANSWER: 'yes', QUESTION: 'q1' }],
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      formId: 'f1',
      centroId: 'c1',
      questions: [{ answer: 'yes', questionId: 'q1' }],
    });
  });

  it('maps filters for list', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ FORM_ID: 'f1', fields: 'FORM_ID' } as any);
    expect(service.findAll).toHaveBeenCalledWith({ formId: 'f1', fields: 'FORM_ID' });
  });

  it('updates validatedByCoord', async () => {
    service.update.mockResolvedValue({ id: 's1' });
    await controller.updateValidatedByCoord('s1');
    expect(service.update).toHaveBeenCalledWith('s1', { validatedByCoordAt: expect.any(Date) });
  });
});
