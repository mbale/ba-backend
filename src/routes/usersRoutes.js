import UsersController from '~/controllers/usersController.js';
import joi from 'joi';

const UsersRoutes = [
  {
    path: '/v1/users',
    method: 'POST',
    handler: UsersController.create,
    config: {
      validate: {
        payload: joi.object().keys({
          username: joi.string().required(),
          password: joi.string().required(),
          email: joi.string().email().optional(),
        }),
      },
    },
  },
];

export default UsersRoutes;
