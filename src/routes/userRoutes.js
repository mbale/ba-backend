import UserController from '~/controllers/userController';
import joi from 'joi';
import joiObjectId from 'joi-objectid';

joi.objectId = joiObjectId(joi);

const UserRoutes = [
  {
    path: '/v1/user',
    method: 'GET',
    handler: UserController.getInfo,
  },
  {
    path: '/v1/user',
    method: 'PUT',
    handler: UserController.editProfile,
    config: {
      validate: {
        payload: joi.object().min(1).keys({
          username: joi.string().optional(),
          email: joi.string().email().optional().allow(''),
        }),
        failAction(request, reply, source, error) {
          const validationObj = {};
          validationObj.data = error.data.details[0].path;
          delete error.output.payload.message;
          delete error.output.payload.validation;
          delete error.output.headers;

          switch (error.data.details[0].type) {
          case 'string.email':
            validationObj.code = 1;
            break;
          case 'number.max':
            validationObj.code = 2;
            break;
          case 'object.min':
            validationObj.code = 3;
            break;
          default:
            validationObj.code = 0;
          }
          error.output.payload.validationError = validationObj;
          reply(error.output).code(error.output.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/user/avatar',
    method: 'POST',
    handler: UserController.uploadAvatar,
    config: {
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
    path: '/v1/user/reset_account',
    method: 'POST',
    handler: UserController.resetAccount,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          email: joi.string().email().required(),
        }),
        failAction(request, reply, source, error) {
          const validationObj = {};
          validationObj.data = error.data.details[0].path;
          delete error.output.payload.message;
          delete error.output.payload.validation;
          delete error.output.headers;

          switch (error.data.details[0].type) {
          case 'string.email':
            validationObj.code = 1;
            break;
          case 'any.required':
            validationObj.code = 2;
            break;
          default:
            validationObj.code = 0;
          }
          error.output.payload.validationError = validationObj;
          reply(error.output).code(error.output.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/user/recover_account',
    method: 'GET',
    handler: UserController.testRecoveryHash,
    config: {
      auth: false,
      validate: {
        headers: joi.object({
          recoveryhash: joi.string().required(),
        }).options({ allowUnknown: true }),
        failAction(request, reply, source, error) {
          const validationObj = {};
          validationObj.data = error.data.details[0].path;
          delete error.output.payload.message;
          delete error.output.payload.validation;
          delete error.output.headers;

          switch (error.data.details[0].type) {
          case 'any.required':
            validationObj.code = 1;
            break;
          default:
            validationObj.code = 0;
          }
          error.output.payload.validationError = validationObj;
          reply(error.output).code(error.output.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/user/recover_account',
    method: 'POST',
    handler: UserController.recoverAccount,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          recoveryHash: joi.required(),
          password: joi.required(),
        }),
        failAction(request, reply, source, error) {
          const validationObj = {};
          validationObj.data = error.data.details[0].path;
          delete error.output.payload.message;
          delete error.output.payload.validation;
          delete error.output.headers;

          switch (error.data.details[0].type) {
          case 'any.required':
            validationObj.code = 1;
            break;
          default:
            validationObj.code = 0;
          }
          error.output.payload.validationError = validationObj;
          reply(error.output).code(error.output.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/user/password',
    method: 'POST',
    handler: UserController.changePassword,
    config: {
      validate: {
        payload: joi.object().min(1).keys({
          password: joi.string().required(),
        }),
        failAction(request, reply, source, error) {
          const validationObj = {};
          validationObj.data = error.data.details[0].path;
          delete error.output.payload.message;
          delete error.output.payload.validation;
          delete error.output.headers;

          switch (error.data.details[0].type) {
          case 'any.required':
            validationObj.code = 1;
            break;
          default:
            validationObj.code = 0;
          }
          error.output.payload.validationError = validationObj;
          reply(error.output).code(error.output.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/user/reviews',
    method: 'GET',
    handler: UserController.getReviews,
    config: {
      validate: {
      },
    },
  },
  {
    path: '/v1/user/reviews',
    method: 'POST',
    handler: UserController.createReview,
    config: {
      validate: {
        payload: joi.object().keys({
          sportsbookId: joi.objectId().required(),
          score: joi.number().min(0).max(10).required(),
          text: joi.string().optional(),
        }),
        failAction(request, reply, source, error) {
          const validationObj = {};
          validationObj.data = error.data.details[0].path;
          delete error.output.payload.message;
          delete error.output.payload.validation;
          delete error.output.headers;

          switch (error.data.details[0].type) {
          case 'any.required':
            validationObj.code = 1;
            break;
          case 'string.regex.base':
            validationObj.code = 2;
            break;
          case 'number.min':
            validationObj.code = 3;
            break;
          case 'number.max':
            validationObj.code = 4;
            break;
          default:
            validationObj.code = 0;
          }
          error.output.payload.validationError = validationObj;
          reply(error.output).code(error.output.statusCode);
        },
      },
    },
  },
  {
    path: '/v1/user/steam',
    method: 'GET',
    handler: UserController.getSteamInfo,
  },
];

export default UserRoutes;
