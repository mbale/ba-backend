import UserController from '~/controllers/userController';
import joi from 'joi';
import joiObjectId from 'joi-objectid';

joi.objectId = joiObjectId(joi);

const UserRoutes = [
  {
    path: '/v1/user',
    method: 'GET',
    handler: UserController.getInfo,
  },
  {
    path: '/v1/user/reviews',
    method: 'GET',
    handler: UserController.getReviews,
    config: {
      validate: {
      },
    },
  },
  {
    path: '/v1/user/reviews',
    method: 'POST',
    handler: UserController.createReview,
    config: {
      validate: {
        payload: joi.object().keys({
          sportsbookId: joi.objectId().required(),
          score: joi.number().min(0).max(10).required(),
          text: joi.string().optional(),
        }),
      },
    },
  },
  {
    path: '/v1/user/steam',
    method: 'GET',
    handler: UserController.getSteamInfo,
  },
];

export default UserRoutes;
