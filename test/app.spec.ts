import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { VehicleValuationRequest } from '../src/valuation/models/vehicle-valuation-request';
import { ValuationService } from '../src/valuation/valuation.service';
import { Repository } from 'typeorm';
import { VehicleValuation } from 'src/valuation/models/vehicle-valuation';

describe('ValuationController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      return request(app.getHttpServer())
        .put('/valuations/')
        .send(requestBody)
        .expect(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const response = await request(app.getHttpServer())
        .put('/valuations/12345678')
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('vrm must be 7 characters or less');
    });

    it('should return 400 if mileage is missing', () => {
      const requestBody: VehicleValuationRequest = {
        mileage: null,
      };

      return request(app.getHttpServer())
        .put('/valuations/ABC123')
        .send(requestBody)
        .expect(400);
    });

    it('should return 400 if mileage is negative', () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      return request(app.getHttpServer())
        .put('/valuations/ABC123')
        .send(requestBody)
        .expect(400);
    });

    it('should return 200 with valid request', () => {
      jest
        .spyOn(ValuationService.prototype, 'createValuation')
        .mockResolvedValueOnce({
          vrm: 'ABC1234',
          lowestValue: 1000,
          highestValue: 2000,
          midpointValue: 1500,
        });
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      return request(app.getHttpServer())
        .put('/valuations/ABC1234')
        .send(requestBody)
        .expect(200);
    });
  });
  describe('GET /valuations/', () => {
    console.log('[x] - running get tests');
    it('should return 200 with valid request', () => {
      jest
        .spyOn(ValuationService.prototype, 'getValuation')
        .mockResolvedValueOnce({
          vrm: 'ABC1234',
          lowestValue: 1000,
          highestValue: 2000,
          midpointValue: 1500,
        });

      return request(app.getHttpServer())
        .get('/valuations/ABC1234')
        .send()
        .expect(200);
    });
  });
  it('should return 400 if mileage is negative', async () => {
    jest
      .spyOn(Repository.prototype, 'findOneBy')
      .mockResolvedValueOnce(Promise.resolve(null));
    const response = await request(app.getHttpServer())
      .get('/valuations/ABC1234')
      .send();

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(`Valuation for VRM ABC1234 not found`);
  });
});
