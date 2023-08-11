import { Test, TestingModule } from '@nestjs/testing';
import { CentrosController } from './centros.controller';
import { CentrosService } from './centros.service';
// import { CacheService } from '../services/cache.service';
import { CentroDocument, Centro } from './schemas/centro.schema';
import {
  RegionalDocument,
  Regional,
} from 'src/regionais/schemas/regionais.schema';
import { CacheService } from '../services/cache.service';
import { getModelToken } from '@nestjs/mongoose';
import { CreateCentroDto } from './dto/create-centro.dto';

function createCentroDocument(centro: Partial<Centro>): CentroDocument {
  return {
    _id: '1', // Adicione o _id, que é uma propriedade do tipo Document
    ...centro,
  } as CentroDocument;
}

function createRegionalDocument(regional: Partial<Regional>): RegionalDocument {
  return {
    _id: '1', // Adicione o _id, que é uma propriedade do tipo Document
    ...regional,
  } as RegionalDocument;
}

// Mock do modelo do Mongoose
const mockCentroModel = {
  /* Defina aqui os métodos do modelo que você usa em CentrosService */
  /* por exemplo, find, findById, create, etc. */
};

// Mock do serviço de cache
const mockCacheService = {
  /* Defina aqui os métodos do serviço de cache que você usa em CentrosService */
  /* por exemplo, get, set, delete, etc. */
};

describe('CentrosController', () => {
  let controller: CentrosController;
  let service: CentrosService;
  const centros: CentroDocument[] = [
    createCentroDocument({
      NOME_CENTRO: 'Centro A',
      NOME_CURTO: 'CA',
      CNPJ_CENTRO: '123456789',
      DATA_FUNDACAO: '2022-01-01',
      REGIONAL: createRegionalDocument({
        NOME_REGIONAL: 'A',
        ESTADO: 'A',
        PAIS: 'A',
      }),
      ENDERECO: 'Endereço A',
      CEP: '12345-678',
      BAIRRO: 'Bairro A',
      CIDADE: 'Cidade A',
      ESTADO: 'Estado A',
      PAIS: 'País A',
    }),
    createCentroDocument({
      NOME_CENTRO: 'Centro B',
      NOME_CURTO: 'CB',
      CNPJ_CENTRO: '987654321',
      DATA_FUNDACAO: '2022-02-01',
      REGIONAL: createRegionalDocument({
        NOME_REGIONAL: 'A',
        ESTADO: 'A',
        PAIS: 'A',
      }),
      ENDERECO: 'Endereço B',
      CEP: '98765-432',
      BAIRRO: 'Bairro B',
      CIDADE: 'Cidade B',
      ESTADO: 'Estado B',
      PAIS: 'País B',
    }),
  ];

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

    controller = module.get<CentrosController>(CentrosController);
    service = module.get<CentrosService>(CentrosService);
  });

  describe('findAll', () => {
    it('should return an array of centros', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue(centros);

      const filterDto = {
        /* preencha aqui os parâmetros do filtro, se necessário */
      };
      const result = await controller.findAll(filterDto);

      expect(result).toBe(centros);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('create', () => {
    it('should return an array of centros', async () => {
      const centro: any = createCentroDocument({
        NOME_CENTRO: 'Centro B',
        NOME_CURTO: 'CB',
        CNPJ_CENTRO: '987654321',
        DATA_FUNDACAO: '2022-02-01',
        REGIONAL: createRegionalDocument({
          NOME_REGIONAL: 'A',
          ESTADO: 'A',
          PAIS: 'A',
        }),
        ENDERECO: 'Endereço B',
        CEP: '98765-432',
        BAIRRO: 'Bairro B',
        CIDADE: 'Cidade B',
        ESTADO: 'Estado B',
        PAIS: 'País B',
      });
      jest.spyOn(service, 'create').mockResolvedValue(centro);

      const centroDto: CreateCentroDto = {
        FUNCIONAMENTO: {
          segunda: ['a'],
          terca: ['a'],
          quarta: ['a'],
          quinta: ['a'],
          sexta: ['a'],
          sabado: ['a'],
          domingo: ['a'],
        },
        NOME_CENTRO: 'string',
        NOME_CURTO: 'string',
        CNPJ_CENTRO: 'string',
        DATA_FUNDACAO: 'string',
        REGIONAL: 'string',
        ENDERECO: 'string',
        CEP: 'string',
        BAIRRO: 'string',
        CIDADE: 'string',
        ESTADO: 'string',
        PAIS: 'string',
      };
      const result = await controller.create(centroDto);

      expect(result).toBe(centro);
      expect(service.create).toHaveBeenCalledWith(centroDto);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
