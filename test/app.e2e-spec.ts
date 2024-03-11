import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { VehicleValuationRequest } from '../src/valuation/models/vehicle-valuation-request';
import { VehicleValuation } from '../src/valuation/models/vehicle-valuation';
import { SuperCarValuationServiceClient } from '../src/super-car/super-car-valuation-service-client';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PremiumCarValuationServiceClient } from '../src/premium-car/premium-car-valuation-service-client';

jest.mock('../src/valuation/models/vehicle-valuation');

describe('ValuationController (e2e)', () => {
  let app: INestApplication;
  let vehicleValuation: Repository<VehicleValuation>;
  let superCarValuationServiceClient: SuperCarValuationServiceClient;
  let premiumCarValuationServiceClient: PremiumCarValuationServiceClient;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: getRepositoryToken(VehicleValuation),
          useClass: Repository,
        },
        SuperCarValuationServiceClient,
        PremiumCarValuationServiceClient,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    vehicleValuation = app.get<Repository<VehicleValuation>>(
      getRepositoryToken(VehicleValuation),
    );
    superCarValuationServiceClient = app.get<SuperCarValuationServiceClient>(
      SuperCarValuationServiceClient,
    );
    premiumCarValuationServiceClient =
      app.get<PremiumCarValuationServiceClient>(
        PremiumCarValuationServiceClient,
      );
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
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
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      jest.spyOn(vehicleValuation, 'insert').mockResolvedValue({} as any);
      jest.spyOn(vehicleValuation, 'findOneBy').mockResolvedValue(null);

      jest.spyOn(superCarValuationServiceClient, 'execute').mockResolvedValue({
        vrm: 'ABC1234',
        lowestValue: 1000,
        highestValue: 2000,
        midpointValue: 1500,
        provider: 'SuperCar',
      });

      return request(app.getHttpServer())
        .put('/valuations/ABC1234')
        .send(requestBody)
        .expect(200);
    });

    it('should return 200 with valid request and fallback', () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      jest.spyOn(vehicleValuation, 'insert').mockResolvedValue({} as any);
      jest.spyOn(vehicleValuation, 'findOneBy').mockResolvedValue(null);

      jest
        .spyOn(superCarValuationServiceClient, 'execute')
        .mockRejectedValue(new Error('Service Unavailable'));

      jest
        .spyOn(premiumCarValuationServiceClient, 'execute')
        .mockResolvedValue({
          vrm: 'ABC1234',
          lowestValue: 1000,
          highestValue: 2000,
          midpointValue: 1500,
          provider: 'PremiumCar',
        });

      return request(app.getHttpServer())
        .put('/valuations/ABC1234')
        .send(requestBody)
        .expect(200);
    });

    it('should return 503 if both services are unavailable', () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      jest.spyOn(vehicleValuation, 'insert').mockResolvedValue({} as any);
      jest.spyOn(vehicleValuation, 'findOneBy').mockResolvedValue(null);

      jest
        .spyOn(superCarValuationServiceClient, 'execute')
        .mockRejectedValue(new Error('Service Unavailable'));

      jest
        .spyOn(premiumCarValuationServiceClient, 'execute')
        .mockRejectedValue(new Error('Service Unavailable'));

      return request(app.getHttpServer())
        .put('/valuations/ABC1234')
        .send(requestBody)
        .expect(503);
    });

    it('should return 200 with valid request and existing valuation', () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      jest.spyOn(vehicleValuation, 'findOneBy').mockResolvedValue({
        vrm: 'ABC1234',
        lowestValue: 1000,
        highestValue: 2000,
        midpointValue: 1500,
        provider: 'SuperCar',
      });

      return request(app.getHttpServer())
        .put('/valuations/ABC1234')
        .send(requestBody)
        .expect(200);
    });
  });

  describe('GET /valuations/', () => {
    it('should return 404 if VRM is missing', () => {
      return request(app.getHttpServer()).get('/valuations/').expect(404);
    });

    it('should return 400 if VRM is 8 characters or more', () => {
      return request(app.getHttpServer())
        .get('/valuations/12345678')
        .expect(400);
    });

    it('should return 404 if valuation not found', () => {
      jest.spyOn(vehicleValuation, 'findOneBy').mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/valuations/ABC1234')
        .expect(404);
    });

    it('should return 200 with valid request', () => {
      jest.spyOn(vehicleValuation, 'findOneBy').mockResolvedValue({
        vrm: 'ABC1234',
        lowestValue: 1000,
        highestValue: 2000,
        midpointValue: 1500,
        provider: 'SuperCar',
      });
      return request(app.getHttpServer())
        .get('/valuations/ABC1234')
        .expect(200);
    });
  });
});
