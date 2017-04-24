import SportsbooksController from '~/controllers/sportsbooksController.js';
import joi from 'joi';
import joiObjectId from 'joi-objectid';

joi.objectId = joiObjectId(joi);

const SportsbooksRoutes = [
  {
    path: '/v1/sportsbooks',
    method: 'GET',
    handler: SportsbooksController.getAll,
    config: {
      auth: false,
      validate: {
        query: {
          limit: joi.number().integer().min(1).max(50)
            .default(10),
        },
      },
    },
  },
  {
    path: '/v1/sportsbooks',
    method: 'POST',
    handler: SportsbooksController.create,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          name: joi.string().required(),
          description: joi.string().optional(),
        }),
      },
    },
  },
  {
    path: '/v1/sportsbooks/{id}/reviews',
    method: 'GET',
    handler: SportsbooksController.reviews,
    config: {
      validate: {
        params: {
          id: joi.objectId().required(),
        },
        query: {
          limit: joi.number().integer().min(1).max(50)
            .default(10),
        },
      },
    },
  },
];

export default SportsbooksRoutes;
