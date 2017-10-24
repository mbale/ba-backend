import Joi from 'joi';
import joiObjectId from 'joi-objectid';
import MatchController from '../controllers/match-controller.js';
import Utils from '../utils.js';

Joi.objectId = joiObjectId(Joi);

const matchRoutes = [
  {
    path: '/v1/matches',
    method: 'GET',
    handler: MatchController.getMatches,
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          game: Joi.string()
            .optional(),
          hometeam: Joi.string()
            .optional()
            .max(30),
          awayteam: Joi.string()
            .optional()
            .max(30),
          startdate: Joi.date().iso()
            .optional()
            .default(new Date(), 'current time with date'),
          enddate: Joi.date().iso()
            .optional()
            .default(() => {
              const date = new Date();
              date.setDate(date.getDate() + parseInt(10, 10));
              // return 7 day later
              return date;
            }, '1 week later'),
          league: Joi.string()
            .optional()
            .max(30),
          limit: Joi.number().integer()
            .min(1).max(100)
            .default(10),
        }),
      },
    },
  },
  {
    path: '/v1/matches/{matchId}',
    method: 'GET',
    handler: MatchController.getMatchDetails,
    config: {
      auth: false,
      validate: {
        params: {
          matchId: Joi.objectId().required(),
        },
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
          case 'string.regex.base':
            joiError = joiError(`${pathCapitalized}Invalid`, `"${pathCapitalized}" contains special character'`);
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
    path: '/v1/matches/{matchId}/predictions',
    method: 'POST',
    handler: MatchController.addPrediction,
    config: {
      validate: {
        payload: {
          oddsId: Joi.objectId().required(),
          stake: Joi.number().valid([1, 2, 3]),
          text: Joi.string().optional(),
          team: Joi.string().valid(['home', 'away']),
        },
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
          case 'any.allowOnly':
            joiError = joiError(`${pathCapitalized}Invalid`, `"${pathCapitalized}" must be a valid ${pathCapitalized}`);
            break;
          case 'string.regex.base':
            joiError = joiError(`${pathCapitalized}Invalid`, `"${pathCapitalized}" contains special character'`);
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
    path: '/v1/matches/{matchId}/predictions/{predictionId}',
    method: 'GET',
    handler: MatchController.getPredictionById,
    config: {
      auth: false,
      validate: {
        params: {
          matchId: Joi.objectId().required(),
          predictionId: Joi.objectId().required(),
        },
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
          case 'string.regex.base':
            joiError = joiError(`${pathCapitalized}Invalid`, `"${pathCapitalized}" contains special character'`);
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

export default matchRoutes;
