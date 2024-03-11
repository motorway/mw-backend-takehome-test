import { Test, TestingModule } from '@nestjs/testing';
import { ValuationService } from './valuation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleValuation } from './models/vehicle-valuation';
import { Repository } from 'typeorm';
import { SuperCarValuationServiceClient } from '../super-car/super-car-valuation-service-client';
import { PremiumCarValuationServiceClient } from '../premium-car/premium-car-valuation-service-client';
import { FallbackManagerModule } from '../shared/fallback/fallback-manager.module';
import { FallbackManager } from '../shared/fallback/fallback-manager.service';

describe('ValuationService', () => {
  let service: ValuationService;
  let valuationRepository: Repository<VehicleValuation>;
  let valuationsServiceClient: SuperCarValuationServiceClient;
  let fallbackValuationsServiceClient: PremiumCarValuationServiceClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FallbackManagerModule],
      providers: [
        ValuationService,
        {
          provide: getRepositoryToken(VehicleValuation),
          useClass: Repository,
        },
        SuperCarValuationServiceClient,
        PremiumCarValuationServiceClient,
        FallbackManager,
        {
          provide: 'FAILURE_THRESHOLD',
          useValue: 0.5,
        },
        {
          provide: 'ROLLING_WINDOW',
          useValue: 5 * 60 * 1000,
        },
        {
          provide: 'THRESHOLD_EXCEEDED_PERIOD',
          useValue: 5 * 60 * 1000 * 2,
        },
      ],
    }).compile();

    service = module.get<ValuationService>(ValuationService);
    valuationRepository = module.get<Repository<VehicleValuation>>(
      getRepositoryToken(VehicleValuation),
    );
    valuationsServiceClient = module.get<SuperCarValuationServiceClient>(
      SuperCarValuationServiceClient,
    );
    fallbackValuationsServiceClient =
      module.get<PremiumCarValuationServiceClient>(
        PremiumCarValuationServiceClient,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createValuation', () => {
    const vrmTestCases = [
      { description: 'too long VRM', vrm: 'ABC12345' },
      { description: 'null VRM', vrm: null },
      { description: 'too short VRM', vrm: 'ABC' },
      { description: 'empty VRM', vrm: '' },
    ];

    const mileage = 10000;

    vrmTestCases.forEach(({ description, vrm }) => {
      it(`should throw an error if the VRM is ${description}`, async () => {
        await expect(service.createValuation(vrm, mileage)).rejects.toThrow();
      });
    });

    const mileageTestCases = [
      { description: 'null mileage', mileage: null },
      { description: 'negative mileage', mileage: -1 },
      { description: 'zero mileage', mileage: 0 },
    ];

    mileageTestCases.forEach(({ description, mileage }) => {
      it(`should throw an error if the mileage is ${description}`, async () => {
        const vrm = 'ABC123';
        await expect(service.createValuation(vrm, mileage)).rejects.toThrow();
      });
    });

    it('should return an existing valuation', async () => {
      const vrm = 'ABC123';
      const mileage = 10000;
      const existingValuation = new VehicleValuation();
      existingValuation.vrm = vrm;
      jest
        .spyOn(valuationRepository, 'findOneBy')
        .mockResolvedValue(existingValuation);
      const result = await service.createValuation(vrm, mileage);
      expect(result).toBe(existingValuation);
    });

    it('should return a valuation from the primary service', async () => {
      const vrm = 'ABC123';
      const mileage = 10000;
      const valuation = new VehicleValuation();
      jest.spyOn(valuationRepository, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(valuationsServiceClient, 'execute')
        .mockResolvedValue(valuation);
      jest.spyOn(valuationRepository, 'insert').mockResolvedValue({} as any);
      const result = await service.createValuation(vrm, mileage);
      expect(result).toBe(valuation);
    });

    it('should return a valuation from the fallback service', async () => {
      const vrm = 'ABC123';
      const mileage = 10000;
      const valuation = new VehicleValuation();
      jest.spyOn(valuationRepository, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(valuationsServiceClient, 'execute')
        .mockRejectedValue(new Error());
      jest
        .spyOn(fallbackValuationsServiceClient, 'execute')
        .mockResolvedValue(valuation);
      jest.spyOn(valuationRepository, 'insert').mockResolvedValue({} as any);

      const result = await service.createValuation(vrm, mileage);
      expect(result).toBe(valuation);
    });

    it('should throw an error if both services fail', async () => {
      const vrm = 'ABC123';
      const mileage = 10000;
      jest.spyOn(valuationRepository, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(valuationsServiceClient, 'execute')
        .mockRejectedValue(new Error());
      jest
        .spyOn(fallbackValuationsServiceClient, 'execute')
        .mockRejectedValue(new Error());
      await expect(service.createValuation(vrm, mileage)).rejects.toThrow();
    });

    it('should throw an error if the fallback service fails', async () => {
      const vrm = 'ABC123';
      const mileage = 10000;
      jest.spyOn(valuationRepository, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(valuationsServiceClient, 'execute')
        .mockRejectedValue(new Error());
      jest
        .spyOn(fallbackValuationsServiceClient, 'execute')
        .mockRejectedValue(new Error());
      await expect(service.createValuation(vrm, mileage)).rejects.toThrow();
    });

    it('should throw an error if the primary service fails', async () => {
      const vrm = 'ABC123';
      const mileage = 10000;
      jest.spyOn(valuationRepository, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(valuationsServiceClient, 'execute')
        .mockRejectedValue(new Error());
      jest
        .spyOn(fallbackValuationsServiceClient, 'execute')
        .mockResolvedValue(null);
      await expect(service.createValuation(vrm, mileage)).rejects.toThrow();
    });
  });

  describe('getValuation', () => {
    it('should return a valuation', async () => {
      const vrm = 'ABC123';
      const valuation = new VehicleValuation();
      jest.spyOn(valuationRepository, 'findOneBy').mockResolvedValue(valuation);
      const result = await service.getValuation(vrm);
      expect(result).toBe(valuation);
    });

    const testCases = [
      { description: 'missing VRM', vrm: '' },
      { description: 'too long VRM', vrm: 'ABC12345' },
      { description: 'null VRM', vrm: null },
      { description: 'too short VRM', vrm: 'ABC' },
    ];

    testCases.forEach(({ description, vrm }) => {
      it(`should throw an error if the VRM is ${description}`, async () => {
        await expect(service.getValuation(vrm)).rejects.toThrow();
      });
    });
  });
});
