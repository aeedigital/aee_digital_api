import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CadastroInfoAppService } from './cadastro-info.service';
import { CadastroInfoRepository } from '../../domain/repositories/cadastro-info.repository';

describe('CadastroInfoAppService', () => {
  let service: CadastroInfoAppService;
  let repository: jest.Mocked<CadastroInfoRepository>;
  let formsService: { findOne: jest.Mock };

  const cadastroInfo = {
    id: 'ci1',
    startDate: '19/01/2026',
    endDate: '27/02/2026',
    formId: 'f1',
    cycleId: 'cycle-1',
    isActive: true,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
      findActive: jest.fn(),
    } as jest.Mocked<CadastroInfoRepository>;

    formsService = {
      findOne: jest.fn(),
    };

    service = new CadastroInfoAppService(repository, formsService as any);
  });

  it('creates cadastro info when none active exists', async () => {
    formsService.findOne.mockResolvedValue({ id: 'f1' });
    repository.findActive.mockResolvedValue(null);
    repository.create.mockResolvedValue(cadastroInfo as any);

    await expect(service.save(cadastroInfo as any)).resolves.toEqual(cadastroInfo);
    expect(repository.create).toHaveBeenCalledWith({
      ...cadastroInfo,
      cycleId: expect.any(String),
    });
  });

  it('updates active cadastro info when one exists', async () => {
    formsService.findOne.mockResolvedValue({ id: 'f1' });
    repository.findActive.mockResolvedValue(cadastroInfo as any);
    repository.update.mockResolvedValue({ ...cadastroInfo, endDate: '28/02/2026' } as any);

    await service.save({ ...cadastroInfo, endDate: '28/02/2026' } as any);
    expect(repository.update).toHaveBeenCalledWith('ci1', {
      ...cadastroInfo,
      endDate: '28/02/2026',
    });
  });

  it('rejects invalid date range', async () => {
    await expect(
      service.save({
        ...cadastroInfo,
        startDate: '28/02/2026',
        endDate: '27/02/2026',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid date format', async () => {
    await expect(
      service.save({
        ...cadastroInfo,
        startDate: '2026-01-19',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates when form is not found', async () => {
    formsService.findOne.mockRejectedValue(new NotFoundException('Form not found'));
    await expect(service.save(cadastroInfo as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns active config', async () => {
    repository.findActive.mockResolvedValue(cadastroInfo as any);
    await expect(service.findActive()).resolves.toEqual(cadastroInfo);
  });

  it('throws when active config is missing', async () => {
    repository.findActive.mockResolvedValue(null);
    await expect(service.findActive()).rejects.toBeInstanceOf(NotFoundException);
  });
});
