import { http, HttpResponse } from 'msw';

const MOCK_API_BASE_URL =
  'https://run.mocky.io/v3/9245229e-5c57-44e1-964b-36c7fb29168b';

export const handlers = [
  http.get(`${MOCK_API_BASE_URL}/valuations/:vrm`, ({ params, request }) => {
    return HttpResponse.json(
      {
        valuation: {
          lowerValue: 25000,
          upperValue: 30000,
        },
      },
      { status: 200 },
    );
  }),
];
