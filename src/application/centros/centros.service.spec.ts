import { ConflictException, NotFoundException } from '@nestjs/common';
import { CentrosAppService } from './centros.service';
import { CentroRepository } from '../../domain/repositories/centro.repository';
import { SummaryAppService } from '../summary/summary.service';
import { Centro } from '../../domain/entities/centro';

describe('CentrosAppService', () => {
  let service: CentrosAppService;
  let repository: jest.Mocked<CentroRepository>;
  let summaryService: jest.Mocked<SummaryAppService>;

  const centro: Centro = {
    id: 'c1',
    funcionamento: {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: [],
    },
    nomeCentro: 'Centro 1',
    nomeCurto: 'C1',
    cnpjCentro: '123',
    dataFundacao: '01/01/2020',
    regional: 'r1',
    endereco: 'Rua 1',
    cep: '00000-000',
    bairro: 'Bairro',
    cidade: 'Cidade',
    estado: 'ST',
    pais: 'BR',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
      saveLocation: jest.fn(),
    };
    summaryService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateOrCreate: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new CentrosAppService(repository, summaryService);
  });

  it('creates a centro', async () => {
    repository.create.mockResolvedValue(centro);
    await expect(service.create(centro)).resolves.toEqual(centro);
    expect(repository.create).toHaveBeenCalledWith({
      ...centro,
      location: expect.objectContaining({
        status: 'PENDENTE',
        addressHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
  });

  it('finds all centros', async () => {
    repository.findAll.mockResolvedValue([centro]);
    await expect(service.findAll({ regional: 'r1' })).resolves.toEqual([centro]);
  });

  it('finds one centro', async () => {
    repository.findById.mockResolvedValue(centro);
    await expect(service.findOne('c1')).resolves.toEqual(centro);
  });

  it('throws when centro not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a centro', async () => {
    repository.findById.mockResolvedValue(centro);
    repository.update.mockResolvedValue(centro);
    await expect(service.update('c1', { nomeCentro: 'Novo' })).resolves.toEqual(centro);
    expect(repository.update).toHaveBeenCalledWith('c1', {
      nomeCentro: 'Novo',
    });
  });

  it('invalidates previous coordinates when address changes', async () => {
    repository.findById.mockResolvedValue({
      ...centro,
      location: {
        status: 'CONFIRMADA',
        latitude: -23,
        longitude: -46,
        addressHash: 'old',
      },
    });
    repository.update.mockResolvedValue(centro);

    await service.update('c1', { endereco: 'Rua Nova, 10' });
    expect(repository.update).toHaveBeenCalledWith('c1', {
      endereco: 'Rua Nova, 10',
      location: expect.objectContaining({
        status: 'PENDENTE',
        addressHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
  });

  it('rejects a stale geocoding result', async () => {
    repository.findById.mockResolvedValue(centro);
    await expect(
      service.saveLocation('c1', {
        addressHash: 'stale',
        status: 'CONFIRMADA',
        latitude: -23,
        longitude: -46,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.saveLocation).not.toHaveBeenCalled();
  });

  it('updateOrCreate delegates to repository', async () => {
    repository.updateOrCreate.mockResolvedValue(centro);
    await expect(service.updateOrCreate({ id: 'c1' }, centro)).resolves.toEqual(centro);
  });

  it('deletes a centro', async () => {
    repository.delete.mockResolvedValue(undefined);
    await expect(service.delete('c1')).resolves.toBeUndefined();
  });

  it('finds summaries for centro', async () => {
    summaryService.findAll.mockResolvedValue([]);
    await expect(service.findSummaries('c1', { formId: 'f1' })).resolves.toEqual([]);
    expect(summaryService.findAll).toHaveBeenCalledWith({ formId: 'f1', centroId: 'c1' });
  });
});
