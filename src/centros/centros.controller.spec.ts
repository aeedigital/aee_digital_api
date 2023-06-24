import { Test, TestingModule } from '@nestjs/testing';
import { CentrosController } from './centros.controller';
import { CentrosService } from './centros.service';
// import { CacheService } from '../services/cache.service';
import { CentroDocument, Centro } from './schemas/centro.schema';


function createCentroDocument(centro: Partial<Centro>): CentroDocument {
  return {
    _id: '1', // Adicione o _id, que é uma propriedade do tipo Document
    ...centro,
  } as CentroDocument;
}

describe('CentrosController', () => {
  let controller: CentrosController;
  let service: CentrosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentrosController],
      providers: [CentrosService],
    }).compile();

    controller = module.get<CentrosController>(CentrosController);
    service = module.get<CentrosService>(CentrosService);
  });

  describe('findAll', () => {
    it('should return an array of centros', async () => {
      const centros: CentroDocument[] = [
        createCentroDocument({
          NOME_CENTRO: 'Centro A',
          NOME_CURTO: 'CA',
          CNPJ_CENTRO: '123456789',
          DATA_FUNDACAO: '2022-01-01',
          REGIONAL: 'Regional A',
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
          REGIONAL: 'Regional B',
          ENDERECO: 'Endereço B',
          CEP: '98765-432',
          BAIRRO: 'Bairro B',
          CIDADE: 'Cidade B',
          ESTADO: 'Estado B',
          PAIS: 'País B',
        }),
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(centros);

      const filterDto = {
        /* preencha aqui os parâmetros do filtro, se necessário */
      };
      const result = await controller.findAll(filterDto);

      expect(result).toBe(centros);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  // it('should be defined', () => {
  //   expect(controller).toBeDefined();
  // });
});
