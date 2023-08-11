import { Test, TestingModule } from '@nestjs/testing';
import { MongoGenericService } from './model.generic.service';
import { CacheService } from '../services/cache.service';
import { Model, Document, Types } from 'mongoose';

import { CentroDocument } from '../centros/schemas/centro.schema';

// Mock do Model do Mongoose
class ModelMock<T> {
  constructor(private data: T[]) {
  }

  // Implemente os métodos necessários para o seu teste
  findById(id: any): any {
    // Implemente o comportamento desejado para o método findById
    const item = this.data[0];
    return {
      exec: jest.fn().mockResolvedValue(item),
    };
  }

  find(): any {
    // Implemente o comportamento desejado para o método find
    return {
      exec: jest.fn().mockResolvedValue(this.data),
    };
  }

  select(fields: any): any {
    // Implemente o comportamento desejado para o método find
    return {
      exec: jest.fn().mockResolvedValue(this.data),
    };
  }

  save(data: T): any {
    // Implemente o comportamento desejado para o método save
    const newItem = { ...data };
    this.data.push(newItem);
    return newItem;
  }

  // Implemente outros métodos necessários para o seu teste
}

describe('GenericModelService', () => {
  let service: MongoGenericService<any>;
  let modelMock: ModelMock<CentroDocument>;

  const mockItem = {
    _id: '61b0ba7c71572500128b85de',
    FUNCIONAMENTO: {
      segunda: ['14:00', ' 20:00'],
      terca: [],
      quarta: [],
      quinta: ['20:00'],
      sexta: [],
      sabado: ['17:00'],
      domingo: [],
    },
    NOME_CENTRO: 'Casa De Timóteo Evangelização E Cultura Espírita',
    NOME_CURTO: 'Casa de Timóteo',
    CNPJ_CENTRO: '43.295.500/0001-00',
    DATA_FUNDACAO: '3/6/1980',
    REGIONAL: '61b0ba7a71572500128b85dc',
    ENDERECO: 'Rua Olavo Gonçalves, 263',
    CEP: '09725-020',
    BAIRRO: 'Vl. Gonçalves',
    CIDADE: 'São Bernardo Do Campo',
    ESTADO: 'SP',
    PAIS: 'Brasil',
    __v: 0,
  };

  const mockItemOnlyNomeCurto = {
    _id: '61b0ba7c71572500128b85de',
    NOME_CURTO: 'Casa de Timóteo',
  };

  // Mock do modelo do Mongoose
  const mockModel = {
    constructor: (data: any) => {
      return {
        save: () => {
          return mockItem;
        },
      };
    },
    findById: () => {
      return {
        exec: () => {
          return mockItem;
        },
      };
    },
    find: () => {
      return {
        exec: () => {
          return [mockItem, mockItem];
        },
        select: () => {
          return {
            exec: () => {
              return [mockItemOnlyNomeCurto, mockItemOnlyNomeCurto];
            },
          };
        },
      };
    },
    save: () => {
      return mockItem;
    },
    modelName: 'Test',
  } as any;
  // Mock do serviço de cache
  const mockCacheService = {
    /* Defina aqui os métodos do serviço de cache que você usa em CentrosService */
    /* por exemplo, get, set, delete, etc. */
    get: () => {
      return;
    },
    set: () => {
      return {
        item: 'item',
      };
    },
  };

  beforeEach(async () => {
    const data = [mockItem, mockItem];
    modelMock = new ModelMock<any>(data);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: Model,
          useValue: modelMock,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        MongoGenericService,
      ],
    }).compile();

    service = module.get<MongoGenericService<any>>(MongoGenericService);
  });

  it('should validate findOne', async () => {
    const item = await service.findOne('teste');
    const expected = mockItem;

    expect(item).toEqual(expected);
  });

  it('should validate findAll', async () => {
    const filter = {
      fields: 'NOME_CURTO',
    };
    const item = await service.findAll(filter);
    const expected = [mockItemOnlyNomeCurto, mockItemOnlyNomeCurto];

    expect(item).toEqual(expected);
  });

  it('should validate findAll with filter', async () => {
    const filter = {
      fields: 'NOME_CURTO',
      NOME_CURTO: 'teste',
    };
    const item = await service.findAll(filter);
    const expected = [mockItemOnlyNomeCurto, mockItemOnlyNomeCurto];

    expect(item).toEqual(expected);
  });

  it('should validate create', async () => {
    const data = {};
    const item = await service.create(data);
    const expected = mockItem;

    expect(item).toEqual(expected);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
