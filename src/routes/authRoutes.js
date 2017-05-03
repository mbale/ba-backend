import AuthController from '~/controllers/authController.js';
import joi from 'joi';
import failActions from '~/helpers/failActions';

const AuthRoutes = [
  {
    path: '/v1/auth',
    method: 'GET',
    handler: AuthController.test,
  },
  {
    path: '/v1/auth',
    method: 'DELETE',
    handler: AuthController.revoke,
  },
  {
    path: '/v1/auth/basic',
    method: 'POST',
    handler: AuthController.basic,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          username: joi.string().required(),
          password: joi.string().required(),
        }),
        failAction: failActions.auth.basic,
      },
    },
  },
  {
    path: '/v1/auth/steam',
    method: 'POST',
    handler: AuthController.steam,
    config: {
      // user could attach social login
      auth: {
        mode: 'optional',
        strategy: 'accessToken',
      },
      validate: {
        payload: joi.object().keys({
          steamId: joi.string().length(17).required(),
          username: joi.string().optional().allow(''),
          email: joi.string().email().optional(),
          password: joi.string().optional().min(6),
        }),
        failAction: failActions.auth.steam,
      },
    },
  },
];

export default AuthRoutes;
