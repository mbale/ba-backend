import * as Joi from 'joi';
import { RouteConfiguration, RouteFailFunction } from 'hapi';
import { refactJoiError, encodeJWTToken, sendMail }  from '../utils';
import AuthController from '../controllers/auth-controller';
import { Output } from 'boom';

const AuthRoutes : RouteConfiguration[] = [
  {
    path: '/v1/auth/basic',
    method: 'POST',
    handler: AuthController.basicAuth,
    config: {
      auth: false,
      validate: {
        payload: Joi.object().keys({
          username: Joi
            .string().required()
            .regex(/^[a-zA-Z0-9_]+$/)
            .lowercase()
            .min(2)
            .max(32),
          password: Joi
            .string().required()
            .min(6).max(16),
        }),
        failAction(request, reply, source, error) {
          let joiError : any = refactJoiError(error);

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
              joiError = joiError(
                `${pathCapitalized}Invalid`, `"${path}" contains special character`);
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
    handler: AuthController.steamAuth,
    config: {
      // user could attach social login
      auth: false,
      validate: {
        payload: Joi.object().keys({
          steamId: Joi
            .string().required()
            .length(17),
        }),
        failAction(request, reply, source, error) {
          let joiError : any = refactJoiError(error);

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
            case 'string.length':
              joiError = joiError(`${pathCapitalized}Length`, message);
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
    path: '/v1/auth/forgot-password',
    method: 'POST',
    handler: AuthController.forgotPassword,
    config: {
      auth: false,
      validate: {
        payload: Joi.object().keys({
          email: Joi
            .string().required()
            .email(),
        }),
        failAction(request, reply, source, error) {
          let joiError : any = refactJoiError(error);

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
            case 'string.email':
              joiError = joiError(`${pathCapitalized}Invalid`, message);
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
    path: '/v1/auth/reset-password',
    method: 'POST',
    handler: AuthController.resetPassword,
    config: {
      auth: false,
      validate: {
        payload: Joi.object().keys({
          recoveryToken: Joi.string().required(),
          password: Joi.string().required()
            .min(6)
            .max(16),
        }),
        failAction(request, reply, source, error) {
          let joiError : any = refactJoiError(error);

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
            case 'any.empty':
              joiError = joiError(`${pathCapitalized}Empty`, message);
              break;
            case 'any.required':
              if (path === 'recovery-token') {
                joiError = joiError('RecoveryTokenRequired', '"RecoveryToken" is required');
              } else {
                joiError = joiError(`${pathCapitalized}Required`, message);
              }
              break;
            case 'string.min':
              joiError = joiError(`${pathCapitalized}Min`, message);
              break;
            case 'string.max':
              joiError = joiError(`${pathCapitalized}Max`, message);
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
    path: '/v1/auth',
    method: 'DELETE',
    handler: AuthController.revokeAccessToken,
  },
];

export default AuthRoutes;
