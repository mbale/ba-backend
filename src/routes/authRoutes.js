import AuthController from '~/controllers/authController.js';
import joi from 'joi';

const AuthRoutes = [
  {
    path: '/v1/auth/basic',
    method: 'POST',
    handler: AuthController.basic,
    config: {
      validate: {
        payload: joi.object().keys({
          username: joi.string().required(),
          password: joi.string().required(),
        }),
      },
    },
  },
  {
    path: '/v1/auth',
    method: 'POST',
    handler: AuthController.steam,
    config: {
      validate: {
        payload: joi.object().keys({
          steamId: joi.string().length(17),
        }),
      },
    },
  },
];

export default AuthRoutes;
