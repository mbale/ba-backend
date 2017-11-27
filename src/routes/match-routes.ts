import MatchController from '../controllers/match-controller';
import { RouteConfiguration } from 'hapi';
import * as Joi from 'joi';

const MatchRoutes : RouteConfiguration[] = [
  {
    path: '/v1/matches',
    method: 'GET',
    handler: MatchController.getMatches,
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          page: Joi.number().optional().default(1),
          limit: Joi.number().optional().default(10),
        }),
      },
    },
  },
];

export default MatchRoutes;
