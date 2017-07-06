import joi from 'joi';
import SportsbooksController from '~/controllers/sportsbooksController.js';
import failActions from '~/helpers/failActions';

const SportsbooksRoutes = [
  {
    path: '/v1/sportsbooks',
    method: 'GET',
    handler: SportsbooksController.getSportsbooks,
    config: {
      auth: false,
      validate: {
        query: {
          limit: joi.number().integer().min(1).max(100)
            .default(10),
        },
        failAction: failActions.sportsbooks.getAll,
      },
    },
  },
  {
    path: '/v1/sportsbooks/{sportsbookslug}',
    method: 'GET',
    handler: SportsbooksController.getSportsbookByName,
    config: {
      auth: false,
      validate: {
        params: {
          sportsbookslug: joi.string().required(),
        },
      },
    },
  },
  {
    path: '/v1/sportsbooks/{sportsbookslug}/reviews',
    method: 'GET',
    handler: SportsbooksController.getSportsbookReviews,
    config: {
      auth: false,
      validate: {
        params: {
          sportsbookslug: joi.string().required(),
        },
        query: {
          limit: joi.number().integer().min(1).max(100)
            .default(10),
        },
        failAction: failActions.sportsbooks.reviews,
      },
    },
  },
  {
    path: '/v1/sportsbooks/{sportsbookslug}/reviews',
    method: 'POST',
    handler: SportsbooksController.addSportsbookReview,
    config: {
      validate: {
        params: {
          sportsbookslug: joi.string().required(),
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
