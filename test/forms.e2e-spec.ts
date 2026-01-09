import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { FormsController } from '../src/forms/forms.controller';
import { FormsAppService } from '../src/application/forms/forms.service';

describe('FormsController (e2e)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateOrCreate: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [{ provide: FormsAppService, useValue: service }],
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
    return request(app.getHttpServer()).post('/forms').send({}).expect(400);
  });

  it('accepts valid payload', () => {
    service.create.mockResolvedValue({ id: 'f1' });
    return request(app.getHttpServer())
      .post('/forms')
      .send({
        NAME: 'Form',
        VERSION: 1,
        CREATEDBY: 'user',
        PAGES: [],
      })
      .expect(201);
  });

  it('lists forms', () => {
    service.findAll.mockResolvedValue([{ id: 'f1' }]);
    return request(app.getHttpServer()).get('/forms').expect(200);
  });
});
