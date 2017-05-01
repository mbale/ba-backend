import UsersController from '~/controllers/usersController.js';
import joi from 'joi';
import _ from 'lodash';

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
          email: joi.string().email().optional().allow(''),
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
          case 'number.min':
            validationObj.code = 2;
            break;
          case 'string.email':
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
];

export default UsersRoutes;
