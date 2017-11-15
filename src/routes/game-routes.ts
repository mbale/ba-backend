import { RouteConfiguration } from 'hapi';
import GameController from '../controllers/game-controller';
import * as Joi from 'joi';
import { refactJoiError } from '../utils';

const GameRoutes : RouteConfiguration[] = [
  {
    path: '/v1/games',
    method: 'GET',
    handler: GameController.getGames,
    config: {
      auth: false,
    },
  },
  {
    path: '/v1/games/{gameSlug}',
    method: 'GET',
    handler: GameController.getGameBySlug,
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

export default GameRoutes;
