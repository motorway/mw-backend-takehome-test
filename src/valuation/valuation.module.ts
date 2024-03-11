import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValuationController } from './valuation.controller';
import { ValuationService } from './valuation.service';
import { VehicleValuation } from './models/vehicle-valuation';
import { SuperCarValuationServiceClient } from '../super-car/super-car-valuation-service-client';
import { PremiumCarValuationServiceClient } from '../premium-car/premium-car-valuation-service-client';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleValuation])],
  controllers: [ValuationController],
  providers: [
    ValuationService,
    SuperCarValuationServiceClient,
    PremiumCarValuationServiceClient,
  ],
})
export class ValuationModule {}
