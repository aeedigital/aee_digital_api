import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { FormsAppService } from '../application/forms/forms.service';

describe('FormsController', () => {
  let controller: FormsController;
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
      controllers: [FormsController],
      providers: [{ provide: FormsAppService, useValue: service }],
    }).compile();

    controller = module.get<FormsController>(FormsController);
    jest.clearAllMocks();
  });

  it('maps create payload', async () => {
    service.create.mockResolvedValue({ id: 'f1' });
    await controller.create({
      NAME: 'Form 1',
      VERSION: 1,
      CREATEDBY: 'user',
      PAGES: [
        {
          NAME: 'Page',
          ROLE: 'role',
          QUIZES: [
            {
              CATEGORY: 'cat',
              QUESTIONS: [{ GROUP: ['q1'], IS_MULTIPLE: false }],
            },
          ],
        },
      ],
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      name: 'Form 1',
      version: 1,
      createdBy: 'user',
      pages: [
        {
          name: 'Page',
          role: 'role',
          quizes: [
            {
              category: 'cat',
              questions: [{ group: ['q1'], isMultiple: false }],
            },
          ],
        },
      ],
    });
  });

  it('maps filters for list', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ NAME: 'Form 1', fields: 'NAME' } as any);
    expect(service.findAll).toHaveBeenCalledWith({
      name: 'Form 1',
      fields: 'NAME',
    });
  });
});
