import { Test, TestingModule } from '@nestjs/testing';
import { PassesController } from './passes.controller';
import { PassesAppService } from '../application/passes/passes.service';

describe('PassesController', () => {
  let controller: PassesController;
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
      controllers: [PassesController],
      providers: [{ provide: PassesAppService, useValue: service }],
    }).compile();

    controller = module.get<PassesController>(PassesController);
    jest.clearAllMocks();
  });

  it('maps create payload', async () => {
    service.create.mockResolvedValue({ id: 'p1' });
    await controller.create({
      user: 'u1',
      pass: 'secret',
      scope_id: 'scope',
      groups: ['g1'],
      lastLogged: null,
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      user: 'u1',
      pass: 'secret',
      scopeId: 'scope',
      groups: ['g1'],
      lastLogged: null,
    });
  });

  it('maps filter for list including scope', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ scope_id: 'scope' } as any);
    expect(service.findAll).toHaveBeenCalledWith({ scopeId: 'scope' });
  });

  it('updates lastLogged endpoint', async () => {
    service.update.mockResolvedValue({ id: 'p1' });
    await controller.updateLastLoggedIn('p1');
    expect(service.update).toHaveBeenCalledWith('p1', { lastLogged: expect.any(Date) });
  });
});
