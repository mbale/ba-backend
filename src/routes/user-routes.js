import joi from 'joi';
import joiObjectId from 'joi-objectid';
import Thurston from 'thurston';
import countryList from 'country-list';
import UserController from '../controllers/user-controller.js';
import Utils from '../utils.js';

const countries = countryList();
joi.objectId = joiObjectId(joi);

const UserRoutes = [
  {
    path: '/v1/user',
    method: 'GET',
    handler: UserController.getPrivateProfile,
  },
  {
    path: '/v1/user',
    method: 'PUT',
    handler: UserController.editProfile,
    config: {
      validate: {
        payload: joi.object().min(1).keys({
          username: joi.string().optional()
            .regex(/^[a-zA-Z0-9_]+$/)
            .min(2)
            .max(32),
          email: joi.string().optional()
            .email()
            .trim(),
          countryCode: joi.string().optional()
            .valid(countries.getCodes())
            .uppercase(),
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
          case 'object.min':
            joiError = joiError('RequestEmpty', 'Request is empty');
            break;
          case 'any.empty':
            joiError = joiError(`${pathCapitalized}Empty`, message);
            break;
          case 'any.allowOnly':
            joiError = joiError(`${pathCapitalized}Invalid`, `"${pathCapitalized}" must be a valid country code`);
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
            joiError = joiError(`${pathCapitalized}Invalid`, `"${path}" should be objectid`);
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
    path: '/v1/user/avatar',
    method: 'POST',
    handler: UserController.uploadAvatar,
    config: {
      validate: {
        payload: Thurston.validate,
        options: {
          whitelist: ['image/png', 'image/jpg', 'image/jpeg'], // allow this filetypes for every route where we define upload validator
        },
      },
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
      },
    },
  },
  {
    path: '/v1/user/avatar',
    method: 'DELETE',
    handler: UserController.deleteAvatar,
  },
  {
    path: '/v1/user/forgot-password',
    method: 'POST',
    handler: UserController.forgotPassword,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          email: joi
            .string().required()
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
    path: '/v1/user/reset-password',
    method: 'GET',
    handler: UserController.getRecoveryTokenInformation,
    config: {
      auth: false,
      validate: {
        headers: joi.object({
          'recovery-token': joi.string().required(),
        }).options({ allowUnknown: true }),
        failAction(request, reply, source, error) {
          let joiError = Utils.refactJoiError(error);

          let {
            data: {
              details,
            },
          } = error;

          details = details[0];

          const {
            type,
          } = details;

          switch (type) {
          case 'any.required':
            joiError = joiError('RecoveryTokenRequired', '"RecoveryToken" is required');
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
    path: '/v1/user/reset-password',
    method: 'POST',
    handler: UserController.resetPassword,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          recoveryToken: joi.string().required(),
          password: joi.string().required()
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
    path: '/v1/user/password',
    method: 'PUT',
    handler: UserController.changePassword,
    config: {
      validate: {
        payload: joi.object().keys({
          oldPassword: joi.string().required()
            .min(6)
            .max(16),
          newPassword: joi.string().required()
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
];

export default UserRoutes;
