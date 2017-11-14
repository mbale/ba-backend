import { RouteConfiguration } from 'hapi';
import RankingController from '../controllers/ranking-controller';

const RankingRoutes: RouteConfiguration[] = [
  {
    path: '/v1/rankings',
    method: 'get',
    handler: RankingController.getLatest,
    config: {
      auth: false,
    }
  },
  {
    path: '/v1/rankings/monthly',
    method: 'get',
    handler: RankingController.getLatest,
    config: {
      auth: false,
    }
  },
];

export default RankingRoutes;