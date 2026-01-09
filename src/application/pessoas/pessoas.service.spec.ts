import { NotFoundException } from '@nestjs/common';
import { PessoasAppService } from './pessoas.service';
import { PersonRepository } from '../../domain/repositories/person.repository';
import { Person } from '../../domain/entities/person';

describe('PessoasAppService', () => {
  let service: PessoasAppService;
  let repository: jest.Mocked<PersonRepository>;

  const person: Person = {
    id: 'p1',
    name: 'Pessoa 1',
    email: 'p1@test.com',
    celular: '9999',
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
    service = new PessoasAppService(repository);
  });

  it('creates a person', async () => {
    repository.create.mockResolvedValue(person);
    await expect(service.create(person)).resolves.toEqual(person);
  });

  it('finds all people', async () => {
    repository.findAll.mockResolvedValue([person]);
    await expect(service.findAll({ name: 'Pessoa 1' })).resolves.toEqual([person]);
  });

  it('finds one person', async () => {
    repository.findById.mockResolvedValue(person);
    await expect(service.findOne('p1')).resolves.toEqual(person);
  });

  it('throws when person not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a person', async () => {
    repository.update.mockResolvedValue(person);
    await expect(service.update('p1', { name: 'Nova' })).resolves.toEqual(person);
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(person);
    await expect(service.updateOrCreate({ id: 'p1' }, person)).resolves.toEqual(person);
  });

  it('deletes a person', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('p1')).resolves.toBeUndefined();
  });
});
