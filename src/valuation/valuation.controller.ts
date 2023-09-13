import { Body, Controller, Get, Param, Put } from '@nestjs/common';

import { VehicleValuation } from './models/vehicle-valuation';
import { VehicleValuationRequest } from './models/vehicle-valuation-request';
import { ValuationService } from './valuation.service';

@Controller('valuations')
export class ValuationController {
  constructor(private readonly valuationService: ValuationService) { }

  @Put(':vrm')
  async createValuation(
    @Param('vrm') vrm: string,
    @Body() request: VehicleValuationRequest,
  ): Promise<VehicleValuation> {
    return this.valuationService.createValuation(vrm, request.mileage);
  }

  @Get(':vrm')
  async getValuation(@Param('vrm') vrm: string): Promise<VehicleValuation> {
    return this.valuationService.getValuation(vrm);
  }
}
