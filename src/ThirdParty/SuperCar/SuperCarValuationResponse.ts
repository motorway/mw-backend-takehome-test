import { Plate } from "./Plate";
import { SuperCarValuation } from "./SuperCarValuation";

export type SuperCarValuationResponse = {
  vin: string;
  registrationDate: string;
  plate: Plate;
  valuation: SuperCarValuation;
};
