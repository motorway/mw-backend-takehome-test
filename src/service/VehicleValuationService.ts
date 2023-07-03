import { Not, Repository } from 'typeorm';
import { SuperCarValuationServiceClient } from '../ThirdParty/SuperCar/SuperCarValuationServiceClient';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VehicleValuation } from '../model/VehicleValuation';


@Injectable()
export class VehicleValuationService {

  valuationsServiceClient: SuperCarValuationServiceClient;

  constructor(
    @InjectRepository(VehicleValuation)
    private readonly valuationRepository: Repository<VehicleValuation>,
  ) {
    this.valuationsServiceClient = new SuperCarValuationServiceClient();
  }

  async createValuation(vrm: string, mileage: number): Promise<VehicleValuation> {

    if (vrm === null || vrm === '' || vrm.length > 7) {
      throw new BadRequestException('vrm must be 7 characters or less');
    }

    if (mileage == null || mileage <= 0) { 
      throw new BadRequestException('mileage must be a positive number');
    }

    const valuation = await this.valuationsServiceClient.execute(vrm, mileage);

    // Save to DB.
    this.valuationRepository.insert(valuation).catch((err) => { 
      if (err.code !== 'SQLITE_CONSTRAINT') {
        throw err;  
      }
    });

    return valuation;
  }

  async getValuation(vrm: string): Promise<VehicleValuation> {

    if (vrm === null || vrm === '' || vrm.length > 7) {
      throw new BadRequestException('vrm must be 7 characters or less');
    }

    var result = await this.valuationRepository.findOneBy({ vrm: vrm });

    if (result == null) {
      throw new NotFoundException(`Valuation for VRM ${vrm} not found`);
    }

    return result;
  }
}

