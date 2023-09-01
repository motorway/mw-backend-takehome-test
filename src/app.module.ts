import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';

import { SuperCarModule } from './super-car/super-car.module';
import { VehicleValuation } from './valuation/models/vehicle-valuation';
import { ValuationModule } from './valuation/valuation.module';

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
    SuperCarModule,
  ],
})
export class AppModule { }
