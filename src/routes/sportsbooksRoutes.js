import SportsbooksController from '~/controllers/sportsbooksController.js';
import joi from 'joi';

const SportsbooksRoutes = [
  {
    path: '/v1/sportsbooks',
    method: 'GET',
    handler: SportsbooksController.getAll,
    config: {
      auth: false,
      validate: {
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
];

export default SportsbooksRoutes;
