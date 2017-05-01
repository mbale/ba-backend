import SportsbooksController from '~/controllers/sportsbooksController.js';
import joi from 'joi';
import joiObjectId from 'joi-objectid';

joi.objectId = joiObjectId(joi);

const SportsbooksRoutes = [
  {
    path: '/v1/sportsbooks',
    method: 'GET',
    handler: SportsbooksController.getAll,
    config: {
      auth: false,
      validate: {
        query: {
          limit: joi.number().integer().min(1).max(50)
            .default(10),
        },
        failAction(request, reply, source, error) {
          const validationObj = {};
          validationObj.data = error.data.details[0].path;
          delete error.output.payload.message;
          delete error.output.payload.validation;
          delete error.output.headers;

          switch (error.data.details[0].type) {
          case 'number.min':
            validationObj.code = 1;
            break;
          case 'number.max':
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
    path: '/v1/sportsbooks',
    method: 'POST',
    handler: SportsbooksController.create,
    config: {
      auth: false,
      validate: {
        payload: joi.object().keys({
          name: joi.string().required(),
          description: joi.string().optional().allow(''),
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
    path: '/v1/sportsbooks/{id}/reviews',
    method: 'GET',
    handler: SportsbooksController.reviews,
    config: {
      validate: {
        params: {
          id: joi.objectId().required(),
        },
        query: {
          limit: joi.number().integer().min(1).max(50)
            .default(10),
        },
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
          case 'number.base':
            validationObj.code = 5;
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

export default SportsbooksRoutes;
