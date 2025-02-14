/** 
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <RegistrationDate>2012-06-14T00:00:00.0000000</RegistrationDate>
  <RegistrationYear>2001</RegistrationYear>
  <RegistrationMonth>10</RegistrationMonth>
  <ValuationPrivateSaleMinimum>11500</ValuationPrivateSaleMinimum>
  <ValuationPrivateSaleMaximum>12750</ValuationPrivateSaleMaximum>
  <ValuationDealershipMinimum>9500</ValuationDealershipMinimum>
  <ValuationDealershipMaximum>10275</ValuationDealershipMaximum>
</Response>
*/

export type PremiumCarValuationResponseFrom = {
  Response: {
    RegistrationDate: string;
    RegistrationYear: string;
    RegistrationMonth: string;
    ValuationPrivateSaleMinimum: number;
    ValuationPrivateSaleMaximum: number;
    ValuationDealershipMinimum: number;
    ValuationDealershipMaximum: number;
  }
};
