import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { LoanApplicationsService } from './../src/loan-applications/loan-applications.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let createLoanApplication: jest.Mock;

  beforeEach(async () => {
    const loanApplication = {
      id: 1,
      client_id: 7,
      requested_amount: 1200,
      term_months: 12,
      status: 'pending',
      installments: [],
    };
    const loanApplicationsService = {
      create: jest.fn().mockResolvedValue(loanApplication),
    };
    createLoanApplication = loanApplicationsService.create;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoanApplicationsService)
      .useValue(loanApplicationsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('POST /loan-applications creates an application', async () => {
    const dto = {
      client_id: 7,
      requested_amount: 1200,
      term_months: 12,
    };

    await request(app.getHttpServer())
      .post('/loan-applications')
      .send(dto)
      .expect(201)
      .expect({
        id: 1,
        ...dto,
        status: 'pending',
        installments: [],
      });

    expect(createLoanApplication).toHaveBeenCalledWith(dto);
  });

  afterEach(async () => {
    await app.close();
  });
});
