import { Test, TestingModule } from '@nestjs/testing';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';

describe('ManagementController', () => {
  let controller: ManagementController;
  const service = { clearCache: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagementController],
      providers: [{ provide: ManagementService, useValue: service }],
    }).compile();

    controller = module.get<ManagementController>(ManagementController);
    jest.clearAllMocks();
  });

  it('calls clearCache', async () => {
    await controller.clearCache();
    expect(service.clearCache).toHaveBeenCalled();
  });
});
