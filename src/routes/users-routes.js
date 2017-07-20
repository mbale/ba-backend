import joi from 'joi';
import joiObjectId from 'joi-objectid';

import UsersController from '~/controllers/users-controller.js';
import Utils from '~/utils.js';

joi.objectId = joiObjectId(joi);

const UsersRoutes = [
  {
    path: '/v1/users',
    method: 'GET',
    handler: UsersController.getUsers,
    config: {
      auth: false,
      validate: {
        query: joi.object().keys({
          userid: joi.alternatives([
            joi.array().items(
              joi.objectId().required(),
            ),
            joi.objectId().required(),
          ]),
        }),
        failAction(request, reply, source, error) {
          let joiError = Utils.refactJoiError(error);

          let {
            data: {
              details,
            },
          } = error;

          details = details[0];

          const {
            message,
            type,
            path,
          } = details;

          const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1);

          switch (type) {
          case 'array.base':
            joiError = joiError(`${pathCapitalized}Invalid`, message);
            break;
          case 'string.regex.base':
            joiError = joiError(`${pathCapitalized}Invalid`, '"userid" should be objectid');
            break;
          default:
            joiError = joiError('UndefinedError', 'Undefined error', 400);
          }
          return reply(joiError).code(joiError.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/users',
    method: 'POST',
    handler: UsersController.createUser,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          username: joi
            .string().required()
            .regex(/^[a-zA-Z0-9_]+$/)
            .lowercase()
            .min(4)
            .max(10),
          password: joi
            .string().required()
            .min(6).max(16),
          email: joi
            .string().optional()
            .email(),
        }),
        failAction(request, reply, source, error) {
          let joiError = Utils.refactJoiError(error);

          let {
            data: {
              details,
            },
          } = error;

          details = details[0];

          const {
            message,
            type,
            path,
          } = details;

          const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1);

          switch (type) {
          case 'any.required':
            joiError = joiError(`${pathCapitalized}Required`, message);
            break;
          case 'any.empty':
            joiError = joiError(`${pathCapitalized}Empty`, message);
            break;
          case 'string.min':
            joiError = joiError(`${pathCapitalized}Min`, message);
            break;
          case 'string.max':
            joiError = joiError(`${pathCapitalized}Max`, message);
            break;
          case 'string.email':
            joiError = joiError(`${pathCapitalized}Invalid`, message);
            break;
          case 'string.regex.base':
            joiError = joiError(`${pathCapitalized}Invalid`, `"${path}" contains special character`);
            break;
          default:
            joiError = joiError('UndefinedError', 'Undefined error', 400);
          }
          return reply(joiError).code(joiError.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/users/{username}',
    method: 'GET',
    handler: UsersController.getPublicProfileByUsername,
    config: {
      auth: false,
      validate: {
        params: {
          username: joi
          .string().required()
          .regex(/^[a-zA-Z0-9_]+$/)
          .lowercase()
          .min(4)
          .max(10),
        },
        failAction(request, reply, source, error) {
          let joiError = Utils.refactJoiError(error);

          let {
            data: {
              details,
            },
          } = error;

          details = details[0];

          const {
            message,
            type,
            path,
          } = details;

          const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1);

          switch (type) {
          case 'any.required':
            joiError = joiError(`${pathCapitalized}Required`, message);
            break;
          case 'any.empty':
            joiError = joiError(`${pathCapitalized}Empty`, message);
            break;
          case 'string.min':
            joiError = joiError(`${pathCapitalized}Min`, message);
            break;
          case 'string.max':
            joiError = joiError(`${pathCapitalized}Max`, message);
            break;
          case 'string.regex.base':
            joiError = joiError(`${pathCapitalized}Invalid`, '"username" contains special character');
            break;
          default:
            joiError = joiError('UndefinedError', 'Undefined error', 400);
          }
          return reply(joiError).code(joiError.statusCode);
        },
      },
    },
  },
];

export default UsersRoutes;
