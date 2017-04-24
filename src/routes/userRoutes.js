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
    path: '/v1/user',
    method: 'PUT',
    handler: UserController.editProfile,
    config: {
      validate: {
        payload: joi.object().min(1).keys({
          username: joi.string().optional(),
          email: joi.string().email().optional().allow(''),
        }),
      },
    },
  },
  {
    path: '/v1/user/reset_account',
    method: 'POST',
    handler: UserController.resetAccount,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          email: joi.string().email().required(),
        }),
      },
    },
  },
  {
    path: '/v1/user/recover_account',
    method: 'GET',
    handler: UserController.testRecoveryHash,
    config: {
      auth: false,
      validate: {
        headers: joi.object({
          recoveryhash: joi.string().required(),
        }).options({ allowUnknown: true }),
      },
    },
  },
  {
    path: '/v1/user/recover_account',
    method: 'POST',
    handler: UserController.recoverAccount,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          recoveryHash: joi.required(),
          password: joi.required(),
        }),
      },
    },
  },
  {
    path: '/v1/user/password',
    method: 'POST',
    handler: UserController.changePassword,
    config: {
      validate: {
        payload: joi.object().min(1).keys({
          password: joi.string().required(),
        }),
      },
    },
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
