import UsersController from '~/controllers/usersController.js';
import joi from 'joi';

const UsersRoutes = [
  {
    path: '/v1/users',
    method: 'POST',
    handler: UsersController.create,
    config: {
      validate: {
      },
    },
  },
];

export default UsersRoutes;
