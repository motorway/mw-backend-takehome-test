import { fastify } from '~root/test/fastify';

import { VehicleValuation } from '@app/models/vehicle-valuation';
import { SupervisorService } from '@app/services/supervisor/supervisor.service';

import { VehicleValuationRequest } from '../types/vehicle-valuation-request';

vi.mock('axios');

describe('ValuationController (e2e)', () => {
  let findOneByMock: ReturnType<typeof vi.fn>;
  let insertMock: ReturnType<typeof vi.fn>;

  let supervisorService: SupervisorService;

  const supervisorRequestMock = vi.fn();


  beforeAll(async () => {
    findOneByMock = vi.fn();
    insertMock = vi.fn();

    fastify.orm.getRepository = vi.fn().mockReturnValue({
      findOneBy: findOneByMock,
      insert: insertMock,
    });

    supervisorService = fastify.supervisorService;
    supervisorService.request = supervisorRequestMock;
  });

  afterAll(() => {
    vi.resetAllMocks();
  })

  afterEach(() => {
    vi.clearAllMocks();
  })

  describe('GET /valuations/{vrm}', () => {
    it('should return 404 if VRM is missing', async () => {
      const res = await fastify.inject({
        url: '/valuations',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const res = await fastify.inject({
        url: '/valuations/12345678',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 with valid request', async () => {
      findOneByMock.mockResolvedValueOnce({
        vrm: 'ABC123',
        value: 15000,
      });

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations',
        method: 'PUT',
        body: requestBody,
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/12345678',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        // @ts-expect-error intentionally malformed payload
        mileage: null,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is negative', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 500 when supervisor blocks', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };
      insertMock.mockResolvedValueOnce(true);

      supervisorRequestMock.mockImplementationOnce(() => { throw 'any error' });

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(500);
    });

    it('should return 200 with valid request when supervisor allow', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };
      insertMock.mockResolvedValueOnce(true);

      supervisorRequestMock.mockImplementationOnce(async () => {
        return <VehicleValuation>{
          highestValue: 1,
          lowestValue: 3,
          provider: 'supercar',
          vrm: `ABC123`
        }
      });

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
    });
  });
});
