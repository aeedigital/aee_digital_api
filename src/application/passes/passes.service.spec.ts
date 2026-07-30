import { NotFoundException } from '@nestjs/common';
import { PassesAppService } from './passes.service';
import { PassRepository } from '../../domain/repositories/pass.repository';
import { Pass } from '../../domain/entities/pass';

describe('PassesAppService', () => {
  let service: PassesAppService;
  let repository: jest.Mocked<PassRepository>;

  const pass: Pass = {
    id: 'p1',
    user: 'user',
    pass: 'secret',
    scopeId: 'scope',
    groups: ['g1'],
    lastLogged: null,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    };
    service = new PassesAppService(repository);
  });

  it('creates a pass', async () => {
    repository.create.mockResolvedValue(pass);
    await expect(service.create(pass)).resolves.toEqual(pass);
  });

  it('finds all passes', async () => {
    repository.findAll.mockResolvedValue([pass]);
    await expect(service.findAll({ scopeId: 'scope' })).resolves.toEqual([pass]);
  });

  it('finds one pass', async () => {
    repository.findById.mockResolvedValue(pass);
    await expect(service.findOne('p1')).resolves.toEqual(pass);
  });

  it('throws when pass not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a pass', async () => {
    repository.update.mockResolvedValue(pass);
    await expect(service.update('p1', { lastLogged: new Date() })).resolves.toEqual(pass);
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(pass);
    await expect(service.updateOrCreate({ id: 'p1' }, pass)).resolves.toEqual(pass);
  });

  it('deletes a pass', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('p1')).resolves.toBeUndefined();
  });
});
