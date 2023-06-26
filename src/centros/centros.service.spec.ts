import { Test, TestingModule } from '@nestjs/testing';
import { CentrosService } from './centros.service';

describe('CentrosService', () => {
  let service: CentrosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CentrosService],
    }).compile();

    service = module.get<CentrosService>(CentrosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
