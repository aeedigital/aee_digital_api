import { Test, TestingModule } from '@nestjs/testing';
import { CentrosService } from './centros.service';
import { CentrosController } from './centros.controller';
import { getModelToken } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';

describe('CentrosService', () => {
  let service: CentrosService;
  // Mock do modelo do Mongoose
  const mockCentroModel = {
    /* Defina aqui os métodos do modelo que você usa em CentrosService */
    /* por exemplo, find, findById, create, etc. */
    findById: () => {
      return {
        exec: () => {
          return function () {
            return true;
          };
        },
      };
    },
  };

  // Mock do serviço de cache
  const mockCacheService = {
    /* Defina aqui os métodos do serviço de cache que você usa em CentrosService */
    /* por exemplo, get, set, delete, etc. */
    get: () => {
      return {
        item: 'item',
      };
    },
    set: () => {
      return {
        item: 'item',
      };
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentrosController],
      providers: [
        CentrosService,
        {
          provide: getModelToken('Centro'),
          useValue: mockCentroModel,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<CentrosService>(CentrosService);
  });

  it('should validate findOne', async () => {
    const item = await service.findOne('teste');
    const expected = {
      item: 'item',
    };

    expect(item).toEqual(expected);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
