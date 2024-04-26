import axios from 'axios';

import { VehicleValuation } from '../models/vehicle-valuation';
import { SuperCarValuationResponse } from './types/super-car-valuation-response';

export async function fetchValuatiomFromSuperCarValuation(
  vrm: string,
  mileage: number,
): Promise<VehicleValuation> {
  axios.defaults.baseURL =
    'https://run.mocky.io/v3/118da5ea-32c5-41e1-9be8-95997cea8e93';
  const response = await axios.get<SuperCarValuationResponse>(
    `valuations/${vrm}?mileage=${mileage}`,
  );

  const valuation = new VehicleValuation();

  valuation.vrm = vrm;
  valuation.lowestValue = response.data.valuation.lowerValue;
  valuation.highestValue = response.data.valuation.upperValue;

  return valuation;
}
