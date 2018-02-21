import MatchController from '../controllers/match-controller';
import { RouteConfiguration } from 'hapi';
import * as Joi from 'joi';
import { MatchStatusType } from 'ba-common';
import { refactJoiError } from '../utils';

const objectIdRegex = /^[a-f\d]{24}$/i;
const allowedStatusTypes: string[] = [];

// we loop through the enum and gather all allowed param
for (const item in MatchStatusType) {
  if (isNaN(Number(item))) {
    allowedStatusTypes.push(item.toLowerCase());
  }
}



const MatchRoutes : RouteConfiguration[] = [
  {
    path: '/v1/matches',
    method: 'GET',
    handler: MatchController.getMatches,
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          page: Joi.number().optional().default(0),
          limit: Joi.number().optional().default(10),
          'gameIds[]': Joi.alternatives(
            Joi.array().items(Joi.string().regex(objectIdRegex)), Joi.string()),
          leagueId: Joi.string().regex(objectIdRegex),
          homeTeamId: Joi.string().regex(objectIdRegex),
          awayTeamId: Joi.string().regex(objectIdRegex),
          statusType: Joi.string().valid(allowedStatusTypes).lowercase(),
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
            case 'number.base':
              joiError = joiError(`${pathCapitalized}Invalid`, message);
              break;
            case 'any.allowOnly':
              joiError = joiError(
                `${pathCapitalized}Invalid`, `"${pathCapitalized}" must be a valid status`);
              break;
            case 'any.empty':
              joiError = joiError(`${pathCapitalized}Empty`, message);
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
    path: '/v1/matches/{matchId}',
    method: 'GET',
    handler: MatchController.getMatch,
    config: {
      auth: false,
      validate: {
        params: {
          matchId: Joi.string().regex(objectIdRegex),
        },
      },
    },
  },
  {
    path: '/v1/matches/{matchId}/predictions',
    method: 'POST',
    handler: MatchController.addPrediction,
    config: {
      validate: {
        params: {
          matchId: Joi.string().regex(objectIdRegex),
        },
        payload: Joi.object().keys({
          stake: Joi.number().allow([0, 1, 3]).required(),
          text: Joi.string().max(3000).optional(),
          oddsId: Joi.string().regex(objectIdRegex).required(),
          team: Joi.string().only(['home', 'away']).required(),
        }),
      },
    },
  },
];

export default MatchRoutes;
