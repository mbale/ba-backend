import AuthController from '~/controllers/authController.js';
import joi from 'joi';

const AuthRoutes = [
  {
    path: '/v1/auth',
    method: 'POST',
    handler: AuthController.login,
    config: {
      validate: {
        payload: joi.object().keys({
          username: joi.string().email().required(),
          password: joi.string().required(),
        }),
      },
    },
  },
];

export default AuthRoutes;
