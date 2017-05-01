import AuthController from '~/controllers/authController.js';
import joi from 'joi';
import _ from 'lodash';

const AuthRoutes = [
  {
    path: '/v1/auth',
    method: 'GET',
    handler: AuthController.test,
  },
  {
    path: '/v1/auth',
    method: 'DELETE',
    handler: AuthController.revoke,
  },
  {
    path: '/v1/auth/basic',
    method: 'POST',
    handler: AuthController.basic,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          username: joi.string().required(),
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
          steamId: joi.string().length(17).required(),
          username: joi.string().optional().allow(''),
          email: joi.string().email().optional(),
          password: joi.string().optional().min(6),
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
          case 'string.length':
            validationObj.code = 2;
            break;
          case 'string.email':
            validationObj.code = 3;
            break;
          case 'string.min':
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
];

export default AuthRoutes;
