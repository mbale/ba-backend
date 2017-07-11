import joi from 'joi';
import joiObjectId from 'joi-objectid';
import UsersController from '~/controllers/usersController.js';
import failActions from '~/helpers/failActions';

joi.objectId = joiObjectId(joi);

const UsersRoutes = [
  {
    path: '/v1/users',
    method: 'POST',
    handler: UsersController.create,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          username: joi.string().required().regex(/^[a-zA-Z0-9_]+$/),
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
  /*
    Get users
    - all by default
    - few by userids
   */
  {
    path: '/v1/users',
    method: 'GET',
    handler: UsersController.getUsers,
    config: {
      auth: false,
      validate: {
        query: joi.object().keys({
          userid: joi.alternatives([
            joi.array().items(joi.objectId().required()),
            joi.objectId().required(),
          ]),
        }),
      },
    },
  },
];

export default UsersRoutes;
