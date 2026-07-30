import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ManagementController } from '../src/management/management.controller';
import { ManagementService } from '../src/management/management.service';

describe('ManagementController (e2e)', () => {
  let app: INestApplication;
  const service = { clearCache: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ManagementController],
      providers: [{ provide: ManagementService, useValue: service }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears cache', () => {
    return request(app.getHttpServer()).get('/clearcache').expect(200);
  });
});
