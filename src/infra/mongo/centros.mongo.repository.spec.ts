import { SummarySourceVersion } from '../../domain/entities/centro';
import { CacheService } from '../../services/cache.service';
import { CentrosMongoRepository } from './centros.mongo.repository';

const existingCentro = {
  _id: 'c1',
  ENDERECO: 'Rua atual',
  SUMMARY_SOURCE_VERSION: {
    UPDATED_AT: new Date('2026-03-01T10:00:00.000Z'),
    CREATED_AT: new Date('2026-02-28T10:00:00.000Z'),
    SUMMARY_ID: 's1',
  },
};

const createCacheStub = () =>
  ({
    invalidateModelCache: jest.fn(),
  }) as unknown as CacheService;

const createModelStub = (updatedDocument: unknown) => {
  const updatedQuery = {
    exec: jest.fn().mockResolvedValue(updatedDocument),
  };
  const existingQuery = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(existingCentro),
  };
  return {
    modelName: 'Centro',
    findOneAndUpdate: jest.fn(
      (
        _filter: Record<string, unknown>,
        _update: {
          $set: Record<string, unknown>;
          $unset?: Record<string, unknown>;
        },
        _options: Record<string, unknown>,
      ) => updatedQuery,
    ),
    findById: jest.fn(() => existingQuery),
  };
};

describe('CentrosMongoRepository summary profile versioning', () => {
  const newerVersion: SummarySourceVersion = {
    updatedAt: new Date('2026-03-02T10:00:00.000Z'),
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    summaryId: 's2',
  };

  it('atomically accepts a newer summary version', async () => {
    const updatedDocument = {
      _id: 'c1',
      ENDERECO: 'Rua nova',
      SUMMARY_SOURCE_VERSION: {
        UPDATED_AT: newerVersion.updatedAt,
        CREATED_AT: newerVersion.createdAt,
        SUMMARY_ID: newerVersion.summaryId,
      },
    };
    const model = createModelStub(updatedDocument);
    const repository = new CentrosMongoRepository(
      model as never,
      createCacheStub(),
    );

    await expect(
      repository.applySummaryProfileIfNewer('c1', newerVersion, {
        endereco: 'Rua nova',
        telefone: '111',
      }),
    ).resolves.toBe(true);
    const [filter, update] = model.findOneAndUpdate.mock.calls[0]!;
    expect(filter).toEqual(
      expect.objectContaining({
        _id: 'c1',
        $or: expect.arrayContaining([
          { SUMMARY_SOURCE_VERSION: { $exists: false } },
          { 'SUMMARY_SOURCE_VERSION.UPDATED_AT': { $lt: newerVersion.updatedAt } },
          {
            'SUMMARY_SOURCE_VERSION.UPDATED_AT': newerVersion.updatedAt,
            'SUMMARY_SOURCE_VERSION.CREATED_AT': { $lt: newerVersion.createdAt },
          },
          {
            'SUMMARY_SOURCE_VERSION.UPDATED_AT': newerVersion.updatedAt,
            'SUMMARY_SOURCE_VERSION.CREATED_AT': newerVersion.createdAt,
            'SUMMARY_SOURCE_VERSION.SUMMARY_ID': { $lt: newerVersion.summaryId },
          },
        ]),
      }),
    );
    expect(update.$set).toEqual(
      expect.objectContaining({
        ENDERECO: 'Rua nova',
        SUMMARY_SOURCE_VERSION: {
          UPDATED_AT: newerVersion.updatedAt,
          CREATED_AT: newerVersion.createdAt,
          SUMMARY_ID: newerVersion.summaryId,
        },
      }),
    );
  });

  it('unsets contacts explicitly cleared in the profile', async () => {
    const model = createModelStub({
      _id: 'c1',
      SUMMARY_SOURCE_VERSION: {
        UPDATED_AT: newerVersion.updatedAt,
        CREATED_AT: newerVersion.createdAt,
        SUMMARY_ID: newerVersion.summaryId,
      },
    });
    const repository = new CentrosMongoRepository(
      model as never,
      createCacheStub(),
    );

    await repository.applySummaryProfileIfNewer('c1', newerVersion, {
      telefone: null,
      site: null,
    });

    const [, update] = model.findOneAndUpdate.mock.calls[0]!;
    expect(update.$unset).toEqual({ TELEFONE: '', SITE: '' });
  });

  it('replaces previous coordinates when a profile changes the address', async () => {
    const model = createModelStub({
      _id: 'c1',
      LOCALIZACAO: {
        STATUS: 'PENDENTE',
        ENDERECO_HASH: 'new-address-hash',
      },
      SUMMARY_SOURCE_VERSION: {
        UPDATED_AT: newerVersion.updatedAt,
        CREATED_AT: newerVersion.createdAt,
        SUMMARY_ID: newerVersion.summaryId,
      },
    });
    const repository = new CentrosMongoRepository(
      model as never,
      createCacheStub(),
    );

    await repository.applySummaryProfileIfNewer('c1', newerVersion, {
      endereco: 'Rua nova',
      location: {
        status: 'PENDENTE',
        addressHash: 'new-address-hash',
      },
    });

    const [, update] = model.findOneAndUpdate.mock.calls[0]!;
    expect(update.$set.LOCALIZACAO).toEqual({
      STATUS: 'PENDENTE',
      ENDERECO_HASH: 'new-address-hash',
    });
  });

  it.each([
    ['repeated', newerVersion],
    [
      'older',
      {
        updatedAt: new Date('2026-02-27T10:00:00.000Z'),
        createdAt: new Date('2026-02-26T10:00:00.000Z'),
        summaryId: 's0',
      },
    ],
  ])('does not update a %s version when the atomic condition does not match', async (_, version) => {
    const model = createModelStub(null);
    const repository = new CentrosMongoRepository(
      model as never,
      createCacheStub(),
    );

    await expect(
      repository.applySummaryProfileIfNewer(
        'c1',
        version as SummarySourceVersion,
        {
        endereco: 'Rua antiga',
        },
      ),
    ).resolves.toBe(false);
    expect(model.findOneAndUpdate).toHaveBeenCalled();
  });
});
