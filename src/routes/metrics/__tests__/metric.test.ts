import { fastify } from '~root/test/fastify';

describe('Metric test (e2e)', () => {
  afterAll(() => {
    vi.resetAllMocks();
  })

  afterEach(() => {
    vi.clearAllMocks();
  })

  describe('GET /metrics', () => {

    it('should return 200 metrics', async () => {
      const res = await fastify.inject({
        url: '/metrics',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toMatchSnapshot();
    });

    it('should return 200 metrics after counter increse', async () => {
      fastify.superCarService.reqCnt.inc();
      fastify.superCarService.reqErrCnt.inc();

      const res = await fastify.inject({
        url: '/metrics',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toMatchSnapshot();
    });
  });
});
