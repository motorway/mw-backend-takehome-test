import axios, { AxiosError } from 'axios';
import { fastify } from '~root/test/fastify';

import { SuperCarService } from '../super-car.service';

vi.mock('axios');

describe('supercar', () => {
    const aroundAxiosMock = vi.fn()
    let superCarServiceInstance: SuperCarService;

    beforeAll(async () => {
        superCarServiceInstance = fastify.superCarService;
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
            const mileage = 10;

            await expect(superCarServiceInstance.request(vrm, mileage)).rejects.toThrow(AxiosError);

            expect(axios.get).toBeCalledWith(
                `${process.env.SUPER_CAR_API}/valuations/${vrm}?mileage=${mileage}`
            );

            expect(aroundAxiosMock).toHaveBeenCalledWith(
                undefined, // error
                `${process.env.SUPER_CAR_API}/valuations/${vrm}?mileage=${mileage}`,
                'supercar',
                vrm
            );
        });

        it('non axios error', async () => {
            aroundAxiosMock.mockImplementationOnce(() => {
                throw new AxiosError('axios error', '404');
            });
            const vrm = `ABC1234567`;
            const mileage = 10;

            await expect(superCarServiceInstance.request(vrm, mileage)).rejects.toThrow(AxiosError);

            expect(axios.get).toBeCalledWith(
                `${process.env.SUPER_CAR_API}/valuations/${vrm}?mileage=${mileage}`
            );

            // Verify that aroundAxiosMock was called with correct arguments
            expect(aroundAxiosMock).toHaveBeenCalledWith(
                undefined, // error
                `${process.env.SUPER_CAR_API}/valuations/${vrm}?mileage=${mileage}`,
                'supercar',
                vrm
            );
        });

        it('wrong payload ', async () => {
            aroundAxiosMock.mockResolvedValueOnce({
                data: { 'nonsense': true }
            });
            const vrm = `ABC1234567`;
            const mileage = 10;

            await expect(superCarServiceInstance.request(vrm, mileage)).rejects.toThrow(Error);

        });

        it('ok', async () => {
            aroundAxiosMock.mockResolvedValueOnce({
                data: {
                    valuation: {
                        lowerValue: 1,
                        upperValue: 1000
                    }
                }
            });

            const vrm = `ABC1234567`;
            const mileage = 10;

            const response = await superCarServiceInstance.request(vrm, mileage);
            expect(response).toMatchSnapshot();
        });
    });
});
