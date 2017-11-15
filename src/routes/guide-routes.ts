import { RouteConfiguration } from 'hapi';
import GuideController from '../controllers/guide-controller';
import * as Joi from 'joi';
import { refactJoiError } from '../utils';

const GuideRoutes : RouteConfiguration[] = [
  {
    path: '/v1/guides',
    method: 'GET',
    handler: GuideController.getGuides,
    config: {
      auth: false,
    },
  }, 
  {
    path: '/v1/guides/{guideSlug}',
    method: 'GET',
    handler: GuideController.getGuideBySlug,
    config: {
      auth: false,
      validate: {
        params: {
          gameSlug: Joi.string().required()
            .trim()
            .lowercase(),
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
            case 'any.required':
              joiError = joiError(`${pathCapitalized}Required`, message);
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

export default GuideRoutes;
