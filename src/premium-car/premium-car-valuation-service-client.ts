import axios from 'axios';

import { VehicleValuation } from '../valuation/models/vehicle-valuation';
import { PremiumCarValuationResponse } from './types/premium-car-valuation-response';

export class PremiumCarValuationServiceClient {
  constructor() {
    axios.defaults.baseURL =
      'https://run.mocky.io/v3/118da5ea-32c5-41e1-9be8-95997cea8e93';
  }

  async execute(vrm: string, mileage: number): Promise<VehicleValuation> {
    const response = await axios.get<PremiumCarValuationResponse>(
      `valuations/${vrm}?mileage=${mileage}`,
    );
    const valuation = new VehicleValuation();
    valuation.vrm = vrm;
    valuation.lowestValue = response.data.valuation.lowerValue;
    valuation.highestValue = response.data.valuation.upperValue;
    return valuation;
  }
}
