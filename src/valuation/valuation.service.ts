import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SuperCarValuationServiceClient } from '../super-car/super-car-valuation-service-client';
import { VehicleValuation } from './models/vehicle-valuation';
import { PremiumCarValuationServiceClient } from '../premium-car/premium-car-valuation-service-client';
import { FallbackManager } from '../shared/fallback/fallback-manager.service';

@Injectable()
export class ValuationService {
  constructor(
    @InjectRepository(VehicleValuation)
    private readonly valuationRepository: Repository<VehicleValuation>,
    private readonly valuationsServiceClient: SuperCarValuationServiceClient,
    private readonly fallbackValuationsServiceClient: PremiumCarValuationServiceClient,
    private readonly fallbackManager: FallbackManager,
  ) {}

  async createValuation(
    vrm: string,
    mileage: number,
  ): Promise<VehicleValuation> {
    this.validateVRM(vrm);
    this.validateMileage(mileage);

    const existingValuation = await this.valuationRepository.findOneBy({
      vrm: vrm,
    });

    if (existingValuation) {
      console.log('Valuation already exists: ', existingValuation);
      return existingValuation;
    }

    const valuation = await this.getProviderValuation(vrm, mileage);

    // Save to DB.
    try {
      await this.valuationRepository.insert(valuation);
    } catch (error) {
      if (error.code !== 'SQLITE_CONSTRAINT') {
        throw error;
      }
    }

    console.log('Valuation created: ', valuation);

    return valuation;
  }

  private async getProviderValuation(vrm: string, mileage: number) {
    let valuation: VehicleValuation;

    try {
      this.fallbackManager.addRequest();
      valuation = await this.valuationsServiceClient.execute(vrm, mileage);
      valuation.provider = 'SuperCar';
    } catch (error) {
      this.fallbackManager.addError();
      console.error('Valuation service failed:', error);

      if (this.fallbackManager.shouldFallback()) {
        console.warn('Fallback to secondary valuation service');
        try {
          valuation = await this.fallbackValuationsServiceClient.execute(
            vrm,
            mileage,
          );
          valuation.provider = 'PremiumCar';
        } catch (fallbackError) {
          console.error('Fallback valuation service failed:', fallbackError);
          throw new ServiceUnavailableException(
            'All valuation services are unavailable',
          );
        }
      } else {
        throw new ServiceUnavailableException(
          'Valuation service failed, and fallback is not triggered',
        );
      }
    }
    return valuation;
  }

  async getValuation(vrm: string): Promise<VehicleValuation> {
    this.validateVRM(vrm);

    const result = await this.valuationRepository.findOneBy({ vrm: vrm });

    if (result == null) {
      throw new NotFoundException(`Valuation for VRM ${vrm} not found`);
    }

    return result;
  }

  private validateVRM(vrm: string): void {
    if (!vrm || vrm.length > 7) {
      throw new BadRequestException('vrm must be 7 characters or less');
    }
  }

  private validateMileage(mileage: number): void {
    if (mileage == null || mileage <= 0) {
      throw new BadRequestException('mileage must be a positive number');
    }
  }
}
