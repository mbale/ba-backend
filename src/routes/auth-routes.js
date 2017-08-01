import joi from 'joi';
import Utils from '../utils.js';
import AuthController from '../controllers/auth-controller.js';

const AuthRoutes = [
  {
    path: '/v1/auth',
    method: 'GET',
    handler: AuthController.getAccessTokenInformation,
  },
  {
    path: '/v1/auth',
    method: 'DELETE',
    handler: AuthController.revokeAccessToken,
  },
  {
    path: '/v1/auth',
    method: 'PUT',
    handler: AuthController.refreshAccessToken,
  },
  {
    path: '/v1/auth/basic',
    method: 'POST',
    handler: AuthController.basicAuthentication,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          username: joi
            .string().required()
            .regex(/^[a-zA-Z0-9_]+$/)
            .lowercase()
            .min(2)
            .max(32),
          password: joi
            .string().required()
            .min(6).max(16),
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
  {
    path: '/v1/auth/steam',
    method: 'POST',
    handler: AuthController.steam,
    config: {
      // user could attach social login
      auth: {
        mode: 'optional',
        strategy: 'accessToken',
      },
      validate: {
        payload: joi.object().keys({
          steamId: joi
            .string().required()
            .length(17),
          username: joi
            .string().optional()
            .min(4)
            .max(10),
          email: joi
            .string().optional()
            .email(),
          password: joi
            .string().optional()
            .min(6)
            .max(16),
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

export default AuthRoutes;
