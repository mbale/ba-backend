import joi from 'joi';
import joiObjectId from 'joi-objectid';
import SportsbooksController from '~/controllers/sportsbooksController.js';
import failActions from '~/helpers/failActions';

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
        failAction: failActions.sportsbooks.getAll,
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
        }),
        failAction: failActions.sportsbooks.create,
      },
    },
  },
  {
    path: '/v1/sportsbooks/{sportsbookname}',
    method: 'GET',
    handler: SportsbooksController.getByName,
    config: {
      auth: false,
    },
  },
  {
    path: '/v1/sportsbooks/{id}/reviews',
    method: 'GET',
    handler: SportsbooksController.reviews,
    config: {
      auth: false,
      validate: {
        params: {
          id: joi.objectId().required(),
        },
        query: {
          limit: joi.number().integer().min(1).max(50)
            .default(10),
        },
        failAction: failActions.sportsbooks.reviews,
      },
    },
  },
  {
    path: '/v1/sportsbooks/{id}/reviews',
    method: 'POST',
    handler: SportsbooksController.createReview,
    config: {
      validate: {
        params: {
          id: joi.objectId().required(),
        },
        payload: joi.object().keys({
          rate: joi.number().min(0).max(5).required(),
          text: joi.string().optional(),
        }),
        failAction: failActions.sportsbooks.createReview,
      },
    },
  },
];

export default SportsbooksRoutes;
