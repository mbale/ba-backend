import UserController from '~/controllers/UserController';
import joi from 'joi';

const UserRoutes = [
  {
    path: '/v1/user',
    method: 'POST',
    handler: UserController.login,
    config: {
      validate: {
        payload: joi.object().keys({
          email: joi.string().email().required(),
          password: joi.string().required(),
        }),
      },
    },
  },
];

export default UserRoutes;
