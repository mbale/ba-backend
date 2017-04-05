import UserController from '~/controllers/userController';
import joi from 'joi';

const UserRoutes = [
  {
    path: '/v1/user',
    method: 'POST',
    handler: UserController.login,
    config: {
      validate: {
      },
    },
  },
];

export default UserRoutes;
