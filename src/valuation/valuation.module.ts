import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValuationController } from './valuation.controller';
import { ValuationService } from './valuation.service';
import { VehicleValuation } from './models/vehicle-valuation';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleValuation])],
  controllers: [ValuationController],
  providers: [ValuationService],
})
export class ValuationModule {}
