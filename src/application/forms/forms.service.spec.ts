import { NotFoundException } from '@nestjs/common';
import { FormsAppService } from './forms.service';
import { FormRepository } from '../../domain/repositories/form.repository';
import { Form } from '../../domain/entities/form';

describe('FormsAppService', () => {
  let service: FormsAppService;
  let repository: jest.Mocked<FormRepository>;

  const form: Form = {
    id: 'f1',
    name: 'Form 1',
    version: 1,
    createdBy: 'user',
    pages: [],
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
    service = new FormsAppService(repository);
  });

  it('creates a form', async () => {
    repository.create.mockResolvedValue(form);
    await expect(service.create(form)).resolves.toEqual(form);
  });

  it('finds all forms', async () => {
    repository.findAll.mockResolvedValue([form]);
    await expect(service.findAll({ name: 'Form 1' })).resolves.toEqual([form]);
  });

  it('finds one form', async () => {
    repository.findById.mockResolvedValue(form);
    await expect(service.findOne('f1')).resolves.toEqual(form);
  });

  it('throws when form not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a form', async () => {
    repository.update.mockResolvedValue(form);
    await expect(service.update('f1', { name: 'Novo' })).resolves.toEqual(form);
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(form);
    await expect(service.updateOrCreate({ id: 'f1' }, form)).resolves.toEqual(form);
  });

  it('deletes a form', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('f1')).resolves.toBeUndefined();
  });
});
