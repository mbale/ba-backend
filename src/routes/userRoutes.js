import UserController from '~/controllers/userController';
import joi from 'joi';
import joiObjectId from 'joi-objectid';
import failActions from '~/helpers/failActions';

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
          email: joi.string().email().optional(),
        }),
        failAction: failActions.user.editProfile,
      },
    },
  },
  {
    path: '/v1/user/avatar',
    method: 'POST',
    handler: UserController.uploadAvatar,
    config: {
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
      },
    },
  },
  {
    path: '/v1/user/avatar',
    method: 'DELETE',
    handler: UserController.deleteAvatar,
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
        failAction: failActions.user.resetAccount,
      },
    },
  },
  {
    path: '/v1/user/recover_account',
    method: 'GET',
    handler: UserController.testRecoveryToken,
    config: {
      auth: false,
      validate: {
        headers: joi.object({
          'recovery-token': joi.string().required(),
        }).options({ allowUnknown: true }),
        failAction: failActions.user.testRecoveryToken,
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
          recoveryToken: joi.required(),
          password: joi.required(),
        }),
        failAction: failActions.user.recoverAccount,
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
          password: joi.string().required().min(6),
        }),
        failAction: failActions.user.changePassword,
      },
    },
  },
  // {
  //   path: '/v1/user/reviews',
  //   method: 'GET',
  //   handler: UserController.getReviews,
  //   config: {
  //     validate: {
  //     },
  //   },
  // },
  {
    path: '/v1/user/steam',
    method: 'GET',
    handler: UserController.getSteamInfo,
  },
];

export default UserRoutes;
