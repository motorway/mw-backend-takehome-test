import axios, { AxiosError } from 'axios';
import { fastify } from '~root/test/fastify';

import { PremiumCarService } from '../premium-car.service';

vi.mock('axios');

describe('premiumCarService', () => {
    const aroundAxiosMock = vi.fn()
    let premiumCarServiceInstance: PremiumCarService;

    beforeAll(async () => {
        premiumCarServiceInstance = fastify.premiumCarService;
        fastify.requestApiLoggerService.aroundAxios = aroundAxiosMock;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('request', () => {

        it('axios error', async () => {
            aroundAxiosMock.mockImplementationOnce(() => {
                throw new AxiosError('axios error', '404');
            });
            const vrm = `ABC1234567`;

            await expect(premiumCarServiceInstance.request(vrm)).rejects.toThrow(AxiosError);

            expect(axios.get).toBeCalledWith(
                `${process.env.PREMIUM_CAR_API}/valueCar?vrm=${vrm}`,
                {
                    "headers": {
                        "Accept": "application/xml",
                    },
                    "responseType": "text",
                },
            );

            // Verify that aroundAxiosMock was called with correct arguments
            expect(aroundAxiosMock).toHaveBeenCalledWith(
                undefined, // error
                `${process.env.PREMIUM_CAR_API}/valueCar?vrm=${vrm}`,
                'premiumcar',
                vrm
            );
        });

        it('non axios error', async () => {
            aroundAxiosMock.mockImplementationOnce(() => {
                throw new Error('Non-axios error');
            });
            const vrm = `ABC1234567`;

            await expect(premiumCarServiceInstance.request(vrm)).rejects.toThrow(Error);
            expect(axios.get).toBeCalledWith(
                `${process.env.PREMIUM_CAR_API}/valueCar?vrm=${vrm}`,
                {
                    "headers": {
                        "Accept": "application/xml",
                    },
                    "responseType": "text",
                },
            );

            expect(aroundAxiosMock).toHaveBeenCalledWith(
                undefined, // error
                `${process.env.PREMIUM_CAR_API}/valueCar?vrm=${vrm}`,
                'premiumcar',
                vrm
            );
        });

        it('wrong payload (brokn xml)', async () => {
            aroundAxiosMock.mockResolvedValueOnce({
                data: `<xml>x`
            });
            const vrm = `ABC1234567`;

            await expect(premiumCarServiceInstance.request(vrm)).rejects.toThrow(Error);

        });

        it('wrong payload (wrong struct xml)', async () => {
            aroundAxiosMock.mockResolvedValueOnce({
                data: `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <Response>
    <RegistrationDate>2012-06-14T00:00:00.0000000</RegistrationDate>
    <RegistrationYear>2001</RegistrationYear>
    <RegistrationMonth>10</RegistrationMonth>
    <ValuationPrivateSaleMinimum>11500</ValuationPrivateSaleMinimum>
    <ValuationPrivateSaleMaximum>12750</ValuationPrivateSaleMaximum>
    <ValuationDealershipMinimum>9500</ValuationDealershipMinimum>
    <ValuationDealershipMaximum>10275</ValuationDealershipMaximum>
    </Response>
</root>`

            });
            const vrm = `ABC1234567`;

            await expect(premiumCarServiceInstance.request(vrm)).rejects.toThrow(Error);

        });




        it('ok', async () => {
            // Simulate an invalid response (e.g., malformed payload)
            aroundAxiosMock.mockResolvedValueOnce({

                data: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <RegistrationDate>2012-06-14T00:00:00.0000000</RegistrationDate>
    <RegistrationYear>2001</RegistrationYear>
    <RegistrationMonth>10</RegistrationMonth>
    <ValuationPrivateSaleMinimum>11500</ValuationPrivateSaleMinimum>
    <ValuationPrivateSaleMaximum>12750</ValuationPrivateSaleMaximum>
    <ValuationDealershipMinimum>9500</ValuationDealershipMinimum>
    <ValuationDealershipMaximum>10275</ValuationDealershipMaximum>
</Response>`

            });
            const vrm = `ABC1234567`;

            const response = await premiumCarServiceInstance.request(vrm);
            expect(response).toMatchSnapshot();
        });
    });
});
