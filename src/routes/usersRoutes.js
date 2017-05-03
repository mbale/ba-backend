import UsersController from '~/controllers/usersController.js';
import failActions from '~/helpers/failActions';
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
          password: joi.string().required().min(6),
          email: joi.string().email().optional(),
        }),
        failAction: failActions.users.create,
      },
    },
  },
];

export default UsersRoutes;
