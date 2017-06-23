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
  {
    path: '/v1/users/{username}',
    method: 'GET',
    handler: UsersController.getByUsername,
    config: {
      auth: false,
      validate: {
        params: {
          username: joi.string().required(),
        },
      },
    },
  },
  // {
  //   path: '/v1/users',
  //   method: 'GET',
  //   handler: UsersController.findUser,
  //   config: {
  //     auth: false,
  //     validate: {
  //       query: joi.object().keys({

  //       }),
  //     },
  //   },
  // },
];

export default UsersRoutes;
