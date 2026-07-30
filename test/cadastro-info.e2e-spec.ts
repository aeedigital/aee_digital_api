import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CadastroInfoController } from '../src/cadastro-info/cadastro-info.controller';
import { CadastroInfoAppService } from '../src/application/cadastro-info/cadastro-info.service';

describe('CadastroInfoController (e2e)', () => {
  let app: INestApplication;
  const service = {
    save: jest.fn(),
    findActive: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CadastroInfoController],
      providers: [{ provide: CadastroInfoAppService, useValue: service }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid payload', () => {
    return request(app.getHttpServer()).post('/cadastro-info').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.save.mockResolvedValue({ id: 'ci1' });
    return request(app.getHttpServer())
      .post('/cadastro-info')
      .send({
        START_DATE: '19/01/2026',
        END_DATE: '27/02/2026',
        FORM_ID: '67b9d55d3a94b5f26c3380d5',
        IS_ACTIVE: true,
      })
      .expect(201);
  });

  it('returns active cadastro info', async () => {
    service.findActive.mockResolvedValue({
      id: 'ci1',
      startDate: '19/01/2026',
      endDate: '27/02/2026',
      formId: '67b9d55d3a94b5f26c3380d5',
      isActive: true,
    });

    await request(app.getHttpServer())
      .get('/cadastro-info/active')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            _id: 'ci1',
            START_DATE: '19/01/2026',
            END_DATE: '27/02/2026',
            FORM_ID: '67b9d55d3a94b5f26c3380d5',
            IS_ACTIVE: true,
          }),
        );
      });
  });
});
