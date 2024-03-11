import { FallbackManager } from './fallback-manager.service';

const SIX_MINUTES = 6 * 60 * 1000; // 6 minutes in milliseconds

describe('FallbackManagerService', () => {
  describe('shouldFallback', () => {
    it('should return true if the failure rate is greater than the threshold', () => {
      const service = new FallbackManager();
      for (let i = 0; i < 6; i++) {
        service.addError(Date.now());
      }
      for (let i = 0; i < 10; i++) {
        service.addRequest(Date.now());
      }
      expect(service.shouldFallback()).toBe(true);
    });

    it('should return false if the failure rate is less than the threshold', () => {
      const service = new FallbackManager();
      for (let i = 0; i < 3; i++) {
        service.addError(i);
      }
      for (let i = 0; i < 10; i++) {
        service.addRequest(Date.now());
      }
      expect(service.shouldFallback()).toBe(false);
    });

    it('should ignore errors outside the rolling window', () => {
      const service = new FallbackManager();
      for (let i = 0; i < 6; i++) {
        service.addError(Date.now() - SIX_MINUTES);
      }
      for (let i = 0; i < 10; i++) {
        service.addRequest(Date.now());
      }
      expect(service.shouldFallback()).toBe(false);
    });

    it('should ignore requests outside the rolling window', () => {
      const service = new FallbackManager();
      for (let i = 0; i < 6; i++) {
        service.addError(Date.now());
      }
      for (let i = 0; i < 10; i++) {
        service.addRequest(Date.now());
        service.addRequest(Date.now() - SIX_MINUTES);
      }
      expect(service.shouldFallback()).toBe(true);
    });

    it('should return true if the service is in the threshold exceeded period', () => {
      const service = new FallbackManager();
      service.addError(Date.now());
      service.addRequest(Date.now());
      service.shouldFallback(Date.now());
      expect(service.shouldFallback(Date.now() + SIX_MINUTES)).toBe(true);
    });

    it('should return false if the service is not in the threshold exceeded period', () => {
      const service = new FallbackManager();
      service.addError(Date.now());
      service.addRequest(Date.now());
      service.shouldFallback(Date.now());
      expect(service.shouldFallback(Date.now() + SIX_MINUTES * 2)).toBe(false);
    });

    it('should still record errors and requests during the threshold exceeded period', () => {
      const service = new FallbackManager();
      service.addError(Date.now());
      service.addRequest(Date.now());
      service.shouldFallback(Date.now());
      service.addError(Date.now() + SIX_MINUTES);
      service.addRequest(Date.now());
      expect(service.shouldFallback()).toBe(true);
    });
  });
});
