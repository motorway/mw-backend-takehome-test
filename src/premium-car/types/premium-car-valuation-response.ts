import { Plate } from './plate';
import { PremiumCarValuation } from './premium-car-valuation';

export type PremiumCarValuationResponse = {
  vin: string;
  registrationDate: string;
  plate: Plate;
  valuation: PremiumCarValuation;
};
