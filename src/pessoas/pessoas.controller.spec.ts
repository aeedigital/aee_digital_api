import { Test, TestingModule } from '@nestjs/testing';
import { PessoasController } from './pessoas.controller';
import { PessoasAppService } from '../application/pessoas/pessoas.service';

describe('PessoasController', () => {
  let controller: PessoasController;
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
      controllers: [PessoasController],
      providers: [{ provide: PessoasAppService, useValue: service }],
    }).compile();

    controller = module.get<PessoasController>(PessoasController);
    jest.clearAllMocks();
  });

  it('maps create payload', async () => {
    service.create.mockResolvedValue({ id: 'p1' });
    await controller.create({
      NOME: 'Pessoa',
      'E-MAIL': 'p@test.com',
      CELULAR: '9999',
    } as any);

    expect(service.create).toHaveBeenCalledWith({
      name: 'Pessoa',
      email: 'p@test.com',
      celular: '9999',
    });
  });

  it('maps filters for list', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ NOME: 'Pessoa', fields: 'NOME' } as any);
    expect(service.findAll).toHaveBeenCalledWith({ name: 'Pessoa', fields: 'NOME' });
  });

  it('maps a partial update payload', async () => {
    service.update.mockResolvedValue({ id: 'p1', celular: '8888' });

    await controller.update('p1', { CELULAR: '8888' });

    expect(service.update).toHaveBeenCalledWith('p1', {
      celular: '8888',
    });
  });
});
