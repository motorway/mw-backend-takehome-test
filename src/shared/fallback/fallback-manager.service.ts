import { Inject, Injectable } from '@nestjs/common';

const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

@Injectable()
export class FallbackManager {
  private requests: number[] = [];
  private errors: number[] = [];
  private lastThresholdExceededTime = 0;
  private currentTimeStamp = Date.now();

  constructor(
    @Inject('FAILURE_THRESHOLD')
    private readonly failureThreshold: number = 0.5,
    @Inject('ROLLING_WINDOW')
    private readonly rollingWindow: number = FIVE_MINUTES,
    @Inject('THRESHOLD_EXCEEDED_PERIOD')
    private readonly thresholdExceededPeriod: number = FIVE_MINUTES * 2,
  ) {}

  shouldFallback(currentTimeStamp = Date.now()): boolean {
    this.currentTimeStamp = currentTimeStamp;
    return this.isCoolingDownPeriod() || this.isThresholdExceeded();
  }

  isCoolingDownPeriod(): boolean {
    return (
      this.currentTimeStamp - this.lastThresholdExceededTime <
      this.thresholdExceededPeriod
    );
  }

  isThresholdExceeded(): boolean {
    const isThresholdExceeded =
      this.calculateFailureRate() > this.failureThreshold;
    if (isThresholdExceeded) {
      this.lastThresholdExceededTime = this.currentTimeStamp;
    }

    return isThresholdExceeded;
  }

  calculateFailureRate(): number {
    if (this.requests.length === 0) {
      return 0;
    }

    this.errors = this.errors.filter(
      (time) => time > this.currentTimeStamp - this.rollingWindow,
    );

    this.requests = this.requests.filter(
      (time) => time > this.currentTimeStamp - this.rollingWindow,
    );

    return this.errors.length / this.requests.length;
  }

  addRequest(currentTimeStamp = Date.now()): void {
    this.requests.push(currentTimeStamp);
  }

  addError(currentTimeStamp = Date.now()): void {
    this.errors.push(currentTimeStamp);
  }
}
