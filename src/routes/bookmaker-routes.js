import joi from 'joi';
import BookmakersController from '~/controllers/bookmaker-controller.js';
import failActions from '~/helpers/failActions.js';

const bookmakersRoutes = [
  {
    path: '/v1/bookmakers',
    method: 'GET',
    handler: BookmakersController.getBookmakers,
    config: {
      auth: false,
      validate: {
        query: {
          limit: joi.number().integer()
            .min(1).max(100)
            .default(10),
        },
        failAction: failActions.sportsbooks.getAll,
      },
    },
  },
  {
    path: '/v1/bookmakers/{bookmakerslug}',
    method: 'GET',
    handler: BookmakersController.getSportsbookBySlug,
    config: {
      auth: false,
      validate: {
        params: {
          bookmakerslug: joi.string().required()
            .lowercase(),
        },
      },
    },
  },
  {
    path: '/v1/bookmakers/{bookmakerslug}/reviews',
    method: 'GET',
    handler: BookmakersController.getSportsbookReviews,
    config: {
      auth: false,
      validate: {
        params: {
          bookmakerslug: joi.string().required(),
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
    path: '/v1/bookmakers/{bookmakerslug}/reviews',
    method: 'POST',
    handler: BookmakersController.addSportsbookReview,
    config: {
      validate: {
        params: {
          bookmakerslug: joi.string().required(),
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

export default bookmakersRoutes;
