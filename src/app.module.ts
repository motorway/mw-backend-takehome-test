import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';

import { VehicleValuation } from './valuation/models/vehicle-valuation';
import { ValuationModule } from './valuation/valuation.module';
import { FallbackManagerModule } from './shared/fallback/fallback-manager.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.resolve(
        process.cwd(),
        'env',
        !ENV ? '.env' : `.env.${ENV}`,
      ),
      load: [() => ({ ENV })],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH,
      synchronize: process.env.SYNC_DATABASE === 'true',
      entities: [VehicleValuation],
    }),
    ValuationModule,
    FallbackManagerModule,
  ],
})
export class AppModule {}
