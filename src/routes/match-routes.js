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
    path: '/v1/matches/{matchId}/comments',
    method: 'GET',
    handler: MatchController.getMatchComments,
    config: {
      auth: false,
    },
  },
  {
    path: '/v1/matches/{matchId}/comments',
    method: 'POST',
    handler: MatchController.addMatchComment,
    config: {
      validate: {
        params: {
          matchId: Joi.objectId().required(),
        },
        payload: Joi.object().keys({
          text: Joi.string().required()
            .min(5)
            .max(500),
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
    path: '/v1/matches/{matchId}/comments/{commentId}',
    method: 'PUT',
    handler: MatchController.editMatchComment,
    config: {
      validate: {
        params: {
          matchId: Joi.objectId().required(),
          commentId: Joi.objectId().required(),
        },
        payload: Joi.object().keys({
          text: Joi.string().required()
            .min(5)
            .max(500),
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
    path: '/v1/matches/{matchId}/comments/{commentId}',
    method: 'DELETE',
    handler: MatchController.removeMatchComment,
    config: {
      validate: {
        params: {
          matchId: Joi.objectId().required(),
          commentId: Joi.objectId().required(),
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
