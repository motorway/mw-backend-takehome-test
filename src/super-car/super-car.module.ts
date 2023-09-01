import { Module } from '@nestjs/common';

import { SuperCarValuationServiceClient } from './super-car-valuation-service-client';

@Module({
  providers: [SuperCarValuationServiceClient],
  exports: [SuperCarValuationServiceClient],
})
export class SuperCarModule { }
