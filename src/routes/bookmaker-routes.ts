import * as Joi from 'joi';
import BookmakersController from '../controllers/bookmaker-controller';
import { RouteConfiguration } from 'hapi';
import { refactJoiError } from '../utils';

const bookmakersRoutes : RouteConfiguration[] = [
  {
    path: '/v1/bookmakers',
    method: 'GET',
    handler: BookmakersController.getBookmakers,
    config: {
      auth: false,
      validate: {
        query: {
          limit: Joi.number().integer()
            .min(1).max(100)
            .default(10),
        },
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
            case 'number.base':
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
  // {
  //   path: '/v1/bookmakers/{bookmakerslug}',
  //   method: 'GET',
  //   handler: BookmakersController.getBookmakerBySlug,
  //   config: {
  //     auth: false,
  //     validate: {
  //       params: {
  //         bookmakerslug: joi.string().required()
  //           .trim()
  //           .lowercase(),
  //       },
  //       failAction(request, reply, source, error) {
  //         let joiError = Utils.refactJoiError(error);

  //         let {
  //           data: {
  //             details,
  //           },
  //         } = error;

  //         details = details[0];

  //         const {
  //           message,
  //           type,
  //           path,
  //         } = details;

  //         const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1);

  //         switch (type) {
  //         case 'any.required':
  //           joiError = joiError(`${pathCapitalized}Required`, message);
  //           break;
  //         default:
  //           joiError = joiError('UndefinedError', 'Undefined error', 400);
  //         }
  //         return reply(joiError).code(joiError.statusCode);
  //       },
  //     },
  //   },
  // },
  // {
  //   path: '/v1/bookmakers/{bookmakerslug}/reviews',
  //   method: 'GET',
  //   handler: BookmakersController.getReviews,
  //   config: {
  //     auth: false,
  //     validate: {
  //       params: {
  //         bookmakerslug: joi.string().required()
  //           .lowercase()
  //           .trim(),
  //       },
  //       failAction(request, reply, source, error) {
  //         let joiError = Utils.refactJoiError(error);

  //         let {
  //           data: {
  //             details,
  //           },
  //         } = error;

  //         details = details[0];

  //         const {
  //           message,
  //           type,
  //           path,
  //         } = details;

  //         const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1);

  //         switch (type) {
  //         case 'any.required':
  //           joiError = joiError(`${pathCapitalized}Required`, message);
  //           break;
  //         default:
  //           joiError = joiError('UndefinedError', 'Undefined error', 400);
  //         }
  //         return reply(joiError).code(joiError.statusCode);
  //       },
  //     },
  //   },
  // },
  // {
  //   path: '/v1/bookmakers/{bookmakerslug}/reviews',
  //   method: 'POST',
  //   handler: BookmakersController.addReview,
  //   config: {
  //     validate: {
  //       params: {
  //         bookmakerslug: joi.string().required()
  //           .lowercase()
  //           .trim(),
  //       },
  //       payload: joi.object().keys({
  //         rate: joi.number().required()
  //           .min(0)
  //           .max(5),
  //         text: joi.string().optional()
  //           .max(3000),
  //       }),
  //       failAction(request, reply, source, error) {
  //         let joiError = Utils.refactJoiError(error);

  //         let {
  //           data: {
  //             details,
  //           },
  //         } = error;

  //         details = details[0];

  //         const {
  //           message,
  //           type,
  //           path,
  //         } = details;

  //         const pathCapitalized = path.charAt(0).toUpperCase() + path.slice(1);

  //         switch (type) {
  //         case 'any.required':
  //           joiError = joiError(`${pathCapitalized}Required`, message);
  //           break;
  //         case 'number.base':
  //           joiError = joiError(`${pathCapitalized}Invalid`, message);
  //           break;
  //         case 'number.min':
  //           joiError = joiError(`${pathCapitalized}Min`, message);
  //           break;
  //         case 'number.max':
  //           joiError = joiError(`${pathCapitalized}Max`, message);
  //           break;
  //         case 'string.max':
  //           joiError = joiError(`${pathCapitalized}Max`, message);
  //           break;
  //         default:
  //           joiError = joiError('UndefinedError', 'Undefined error', 400);
  //         }
  //         return reply(joiError).code(joiError.statusCode);
  //       },
  //     },
  //   },
  // },
];

export default bookmakersRoutes;
