import { PassesMongoRepository } from './passes.mongo.repository';
import { PessoasMongoRepository } from './pessoas.mongo.repository';
import { QuestionsMongoRepository } from './questions.mongo.repository';
import { RegionaisMongoRepository } from './regionais.mongo.repository';
import { CentrosMongoRepository } from './centros.mongo.repository';
import { FormsMongoRepository } from './forms.mongo.repository';
import { SummariesMongoRepository } from './summaries.mongo.repository';
import { AnswersMongoRepository } from './answers.mongo.repository';
import { CacheService } from '../../services/cache.service';

const createModelStub = (doc: any) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(doc),
    lean: jest.fn().mockResolvedValue(doc),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  };
  return {
    modelName: 'Test',
    watch: jest.fn(() => ({ on: jest.fn() })),
    findByIdAndUpdate: jest.fn(() => chain),
    findById: jest.fn(() => chain),
    find: jest.fn(() => chain),
    aggregate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
    countDocuments: jest.fn(() => ({ exec: jest.fn().mockResolvedValue(0) })),
  };
};

const createCacheStub = () =>
  ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidateModelCache: jest.fn(),
  }) as unknown as CacheService;

describe('Mongo repositories mappings', () => {
  it('maps passes repository', async () => {
    const model = createModelStub({ _id: 'p1', user: 'u', pass: 'x', scope_id: 's', groups: [] });
    class TestRepo extends PassesMongoRepository {
      mapDomain(doc: any) {
        return this.toDomain(doc);
      }
      mapFilter(filter: any) {
        return this.buildFilter(filter);
      }
      mapPersist(data: any) {
        return this.toPersistence(data);
      }
    }
    const repo = new TestRepo(model as any, createCacheStub());
    expect(repo.mapDomain({ _id: 'p1', user: 'u', pass: 'x', scope_id: 's' })).toEqual(
      expect.objectContaining({ id: 'p1', user: 'u', pass: 'x', scopeId: 's' }),
    );
    expect(repo.mapFilter({ scopeId: 's' })).toEqual({ scope_id: 's' });
    expect(repo.mapPersist({ scopeId: 's', user: 'u' })).toEqual({ scope_id: 's', user: 'u' });
    await repo.update('p1', { pass: 'y' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('maps pessoas repository', async () => {
    const model = createModelStub({ _id: 'p1', NOME: 'N', 'E-MAIL': 'e', CELULAR: 'c' });
    class TestRepo extends PessoasMongoRepository {
      mapDomain(doc: any) {
        return this.toDomain(doc);
      }
      mapFilter(filter: any) {
        return this.buildFilter(filter);
      }
      mapPersist(data: any) {
        return this.toPersistence(data);
      }
    }
    const repo = new TestRepo(model as any, createCacheStub());
    expect(repo.mapDomain({ _id: 'p1', NOME: 'N', 'E-MAIL': 'e', CELULAR: 'c' })).toEqual({
      id: 'p1',
      name: 'N',
      email: 'e',
      celular: 'c',
    });
    expect(repo.mapFilter({ email: 'e' })).toEqual({ 'E-MAIL': 'e' });
    expect(repo.mapPersist({ name: 'N' })).toEqual({ NOME: 'N' });
    await repo.update('p1', { name: 'Novo' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('maps questions repository', async () => {
    const model = createModelStub({ _id: 'q1', QUESTION: 'Q' });
    class TestRepo extends QuestionsMongoRepository {
      mapDomain(doc: any) {
        return this.toDomain(doc);
      }
      mapFilter(filter: any) {
        return this.buildFilter(filter);
      }
      mapPersist(data: any) {
        return this.toPersistence(data);
      }
    }
    const repo = new TestRepo(model as any, createCacheStub());
    expect(repo.mapDomain({ _id: 'q1', QUESTION: 'Q', PRESET_VALUES: [] })).toEqual(
      expect.objectContaining({ id: 'q1', question: 'Q' }),
    );
    expect(repo.mapFilter({ question: 'Q' })).toEqual({ QUESTION: 'Q' });
    expect(repo.mapPersist({ question: 'Q' })).toEqual({ QUESTION: 'Q' });
    await repo.update('q1', { question: 'Q2' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('maps regionais repository', async () => {
    const model = createModelStub({ _id: 'r1', NOME_REGIONAL: 'R' });
    const centroModel = createModelStub({});
    const summaryModel = createModelStub({});
    class TestRepo extends RegionaisMongoRepository {
      mapDomain(doc: any) {
        return this.toDomain(doc);
      }
      mapFilter(filter: any) {
        return this.buildFilter(filter);
      }
      mapPersist(data: any) {
        return this.toPersistence(data);
      }
    }
    const repo = new TestRepo(
      model as any,
      centroModel as any,
      summaryModel as any,
      createCacheStub(),
    );
    expect(repo.mapDomain({ _id: 'r1', NOME_REGIONAL: 'R', PAIS: 'BR', COORDENADOR_ID: 'c' }))
      .toEqual({ id: 'r1', nomeRegional: 'R', pais: 'BR', coordenadorId: 'c' });
    expect(repo.mapFilter({ nomeRegional: 'R' })).toEqual({ NOME_REGIONAL: 'R' });
    expect(repo.mapPersist({ nomeRegional: 'R' })).toEqual({ NOME_REGIONAL: 'R' });
    await repo.update('r1', { pais: 'AR' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();

    await repo.overview({});
    expect(model.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $addFields: expect.objectContaining({
            eligibleCentros: '$centros',
          }),
        }),
      ]),
    );

    await repo.overview({
      excludeRule: {
        questionId: '61ec11fe69001e0012bc299a',
        answers: ['Encerrada', 'Desfiliada'],
        summarySelection: 'latest',
        matchMode: 'trim-case-insensitive',
      },
    });
    expect(model.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $lookup: expect.objectContaining({
            as: 'excludedCentros',
          }),
        }),
        expect.objectContaining({
          $addFields: expect.objectContaining({
            eligibleCentros: expect.any(Object),
          }),
        }),
      ]),
    );
  });

  it('maps centros repository', async () => {
    const model = createModelStub({ _id: 'c1', NOME_CENTRO: 'C' });
    class TestRepo extends CentrosMongoRepository {
      mapDomain(doc: any) {
        return this.toDomain(doc);
      }
      mapFilter(filter: any) {
        return this.buildFilter(filter);
      }
      mapPersist(data: any) {
        return this.toPersistence(data);
      }
    }
    const repo = new TestRepo(model as any, createCacheStub());
    expect(repo.mapDomain({ _id: 'c1', NOME_CENTRO: 'C', REGIONAL: 'r1' })).toEqual(
      expect.objectContaining({ id: 'c1', nomeCentro: 'C', regional: 'r1' }),
    );
    expect(repo.mapFilter({ nomeCentro: 'C' })).toEqual({ NOME_CENTRO: 'C' });
    expect(repo.mapPersist({ nomeCentro: 'C' })).toEqual({ NOME_CENTRO: 'C' });
    await repo.update('c1', { nomeCentro: 'C2' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('maps forms repository', async () => {
    const model = createModelStub({ _id: 'f1', NAME: 'F' });
    class TestRepo extends FormsMongoRepository {
      mapDomain(doc: any) {
        return this.toDomain(doc);
      }
      mapFilter(filter: any) {
        return this.buildFilter(filter);
      }
      mapPersist(data: any) {
        return this.toPersistence(data);
      }
    }
    const repo = new TestRepo(model as any, createCacheStub());
    expect(repo.mapDomain({ _id: 'f1', NAME: 'F', VERSION: 1, CREATEDBY: 'u', PAGES: [] }))
      .toEqual(expect.objectContaining({ id: 'f1', name: 'F', version: 1, createdBy: 'u' }));
    expect(repo.mapFilter({ name: 'F' })).toEqual({ NAME: 'F' });
    expect(repo.mapPersist({ name: 'F' })).toEqual({ NAME: 'F' });
    await repo.update('f1', { name: 'F2' });
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('maps summaries repository', async () => {
    const model = createModelStub({ _id: 's1', FORM_ID: 'f1', CENTRO_ID: 'c1' });
    const centroModel = createModelStub({});
    class TestRepo extends SummariesMongoRepository {
      mapDomain(doc: any) {
        return this.toDomain(doc);
      }
      mapFilter(filter: any) {
        return this.buildFilter(filter);
      }
      mapPersist(data: any) {
        return this.toPersistence(data);
      }
    }
    const repo = new TestRepo(model as any, centroModel as any, createCacheStub());
    expect(repo.mapDomain({ _id: 's1', FORM_ID: 'f1', CENTRO_ID: 'c1', QUESTIONS: [] }))
      .toEqual(expect.objectContaining({ id: 's1', formId: 'f1', centroId: 'c1' }));
    expect(repo.mapFilter({ formId: 'f1' })).toEqual({ FORM_ID: 'f1' });
    expect(repo.mapPersist({ formId: 'f1', centroId: 'c1' })).toEqual({
      FORM_ID: 'f1',
      CENTRO_ID: 'c1',
    });
    await repo.update('s1', { formId: 'f2' } as any);
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('maps answers repository', async () => {
    const model: any = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: 'a1', ...data }),
    }));
    model.find = jest.fn(() => ({ lean: jest.fn().mockResolvedValue([]) }));
    model.findById = jest.fn(() => ({ lean: jest.fn().mockResolvedValue(null) }));
    model.findByIdAndUpdate = jest.fn(() => ({ exec: jest.fn().mockResolvedValue({ _id: 'a1' }) }));
    model.findOneAndUpdate = jest.fn(() => ({ exec: jest.fn().mockResolvedValue({ _id: 'a1' }) }));
    model.deleteOne = jest.fn(() => ({ lean: jest.fn().mockResolvedValue(undefined) }));

    const repo = new AnswersMongoRepository(model as any);
    await repo.create({ questionId: 'q1', centroId: 'c1', answer: 'yes' });
    await repo.findAll({ questionId: 'q1' });
    await repo.update('a1', { answer: 'no' });
    await repo.updateOrCreate({ id: 'a1' }, { questionId: 'q1', centroId: 'c1', answer: 'yes' });
    await repo.delete('a1');
    expect(model.find).toHaveBeenCalled();
    expect(model.findByIdAndUpdate).toHaveBeenCalled();
  });
});
