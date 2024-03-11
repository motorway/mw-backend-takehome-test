// fallback-manager.module.ts
import { Global, Module } from '@nestjs/common';
import { FallbackManager } from './fallback-manager.service';

@Global()
@Module({
  providers: [
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
  exports: [FallbackManager],
})
export class FallbackManagerModule {}
