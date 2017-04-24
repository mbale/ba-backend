import UsersController from '~/controllers/usersController.js';
import joi from 'joi';

const UsersRoutes = [
  {
    path: '/v1/users',
    method: 'POST',
    handler: UsersController.create,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          username: joi.string().required(),
          password: joi.string().required(),
          email: joi.string().email().optional().allow(''),
        }),
      },
    },
  },
];

export default UsersRoutes;
