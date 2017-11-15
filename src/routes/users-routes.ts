import * as Joi from 'Joi';
import JoiObjectId from 'Joi-objectid';
import { RouteConfiguration } from 'hapi';
import { refactJoiError } from '../utils';
import UsersController from '../controllers/users-controller';
import * as countryList from 'country-list';

// Joi.objectId = JoiObjectId(Joi);

const UsersRoutes : RouteConfiguration[] = [
  {
    path: '/v1/users/me',
    method: 'GET',
    handler: UsersController.getLoggedUserProfile,
  },
  {
    path: '/v1/users/me',
    method: 'PUT',
    handler: UsersController.editLoggedUserProfile,
    config: {
      validate: {
        payload: Joi.object().min(1).keys({
          username: Joi.string().optional()
            .regex(/^[a-zA-Z0-9_]+$/)
            .min(2)
            .max(32),
          email: Joi.string().optional()
            .email()
            .trim(),
          password: Joi.string().optional()
            .min(6).max(16),
          countryCode: Joi.string().optional()
            .valid(countryList().getCodes())
            .uppercase(),
        }),
        failAction(request, reply, source, error) {
          let JoiError : any = refactJoiError(error);

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
            case 'object.min':
              JoiError = JoiError('RequestEmpty', 'Request is empty');
              break;
            case 'any.empty':
              JoiError = JoiError(`${pathCapitalized}Empty`, message);
              break;
            case 'any.required':
              JoiError = JoiError(`${pathCapitalized}Required`, message);
              break;
            case 'any.allowOnly':
              JoiError = JoiError(
                `${pathCapitalized}Invalid`, `"${pathCapitalized}" must be a valid country code`);
              break;
            case 'string.min':
              JoiError = JoiError(`${pathCapitalized}Min`, message);
              break;
            case 'string.max':
              JoiError = JoiError(`${pathCapitalized}Max`, message);
              break;
            case 'string.email':
              JoiError = JoiError(`${pathCapitalized}Invalid`, message);
              break;
            case 'string.regex.base':
              JoiError = JoiError(`${pathCapitalized}Invalid`, `"${path}" must be valid username`);
              break;
            default:
              JoiError = JoiError('UndefinedError', 'Undefined error', 400);
          }
          return reply(JoiError).code(JoiError.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/users/me/avatar',
    method: 'POST',
    handler: UsersController.uploadAvatar,
    config: {
      validate: {},
      
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
      },
    },
  },
  {
    path: '/v1/users/me/avatar',
    method: 'DELETE',
    handler: UsersController.deleteAvatar,
  },
  {
    path: '/v1/users',
    method: 'POST',
    handler: UsersController.createUser,
    config: {
      auth: false,
      validate: {
        payload: Joi.object().keys({
          username: Joi
            .string().required()
            .regex(/^[a-zA-Z0-9_]+$/)
            .lowercase()
            .min(2)
            .max(32)
            .disallow(['me']),
          password: Joi
            .string().required()
            .min(6).max(16),
          email: Joi
            .string().required()
            .email()
            .trim(),
        }),
        failAction(request, reply, source, error) {
          let JoiError : any = refactJoiError(error);

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
              JoiError = JoiError(`${pathCapitalized}Required`, message);
              break;
            case 'any.empty':
              JoiError = JoiError(`${pathCapitalized}Empty`, message);
              break;
            case 'any.invalid':
              JoiError = JoiError(`${pathCapitalized}Invalid`, message);
              break;
            case 'string.min':
              JoiError = JoiError(`${pathCapitalized}Min`, message);
              break;
            case 'string.max':
              JoiError = JoiError(`${pathCapitalized}Max`, message);
              break;
            case 'string.email':
              JoiError = JoiError(`${pathCapitalized}Invalid`, message);
              break;
            case 'string.regex.base':
              JoiError = JoiError(
                `${pathCapitalized}Invalid`, `"${path}" contains special character`);
              break;
            default:
              JoiError = JoiError('UndefinedError', 'Undefined error', 400);
          }
          return reply(JoiError).code(JoiError.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/users/{username}',
    method: 'GET',
    handler: UsersController.getUserByUsername,
    config: {
      auth: false,
      validate: {
        params: {
          username: Joi
          .string().required()
          .regex(/^[a-zA-Z0-9_]+$/)
          .lowercase()
          .min(2)
          .max(32),
        },
        failAction(request, reply, source, error) {
          let JoiError : any  = refactJoiError(error);

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
              JoiError = JoiError(`${pathCapitalized}Required`, message);
              break;
            case 'any.empty':
              JoiError = JoiError(`${pathCapitalized}Empty`, message);
              break;
            case 'string.min':
              JoiError = JoiError(`${pathCapitalized}Min`, message);
              break;
            case 'string.max':
              JoiError = JoiError(`${pathCapitalized}Max`, message);
              break;
            case 'string.regex.base':
              JoiError = JoiError(
                `${pathCapitalized}Invalid`, '"username" contains special character');
              break;
            default:
              JoiError = JoiError('UndefinedError', 'Undefined error', 400);
          }
          return reply(JoiError).code(JoiError.statusCode);
        },
      },
    },
  },
];

export default UsersRoutes;
