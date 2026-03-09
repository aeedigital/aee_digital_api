import { Test, TestingModule } from '@nestjs/testing';
import { CadastroInfoController } from './cadastro-info.controller';
import { CadastroInfoAppService } from '../application/cadastro-info/cadastro-info.service';

describe('CadastroInfoController', () => {
  let controller: CadastroInfoController;
  const service = {
    save: jest.fn(),
    findActive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CadastroInfoController],
      providers: [{ provide: CadastroInfoAppService, useValue: service }],
    }).compile();

    controller = module.get<CadastroInfoController>(CadastroInfoController);
    jest.clearAllMocks();
  });

  it('maps save payload', async () => {
    service.save.mockResolvedValue({
      id: 'ci1',
      startDate: '19/01/2026',
      endDate: '27/02/2026',
      formId: 'f1',
      isActive: true,
    });

    await controller.save({
      START_DATE: '19/01/2026',
      END_DATE: '27/02/2026',
      FORM_ID: 'f1',
      IS_ACTIVE: true,
    } as any);

    expect(service.save).toHaveBeenCalledWith({
      startDate: '19/01/2026',
      endDate: '27/02/2026',
      formId: 'f1',
      isActive: true,
    });
  });

  it('returns active payload in uppercase', async () => {
    service.findActive.mockResolvedValue({
      id: 'ci1',
      startDate: '19/01/2026',
      endDate: '27/02/2026',
      formId: 'f1',
      isActive: true,
    });

    await expect(controller.findActive()).resolves.toEqual(
      expect.objectContaining({
        _id: 'ci1',
        START_DATE: '19/01/2026',
        END_DATE: '27/02/2026',
        FORM_ID: 'f1',
        IS_ACTIVE: true,
      }),
    );
  });
});
