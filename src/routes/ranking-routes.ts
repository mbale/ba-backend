import { RouteConfiguration } from 'hapi';
import RankingController from '../controllers/ranking-controller';
import * as Joi from 'joi';

const RankingRoutes: RouteConfiguration[] = [
  {
    path: '/v1/ranking',
    method: 'GET',
    handler: RankingController.getRankingBoard,
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          month: Joi.number().allow([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).optional(),
          overall: Joi.bool().only([true, false]).optional(),
        }).xor('month', 'overall'), // we need one or other
      },
    },
  },
];

export default RankingRoutes;
