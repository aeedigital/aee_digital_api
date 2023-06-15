import { Test, TestingModule } from '@nestjs/testing';
import { CentrosController } from './centros.controller';
import { CentrosService } from './centros.service';
import { CacheService } from '../services/cache.service'

describe('CentrosController', () => {
  let controller: CentrosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentrosController],
      providers: [CentrosService, CacheService],
    }).compile();

    controller = module.get<CentrosController>(CentrosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
