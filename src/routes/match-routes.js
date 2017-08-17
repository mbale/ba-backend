import Joi from 'joi';
import MatchController from '../controllers/match-controller.js';

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
            .optional()
            .allow(['csgo', 'overwatch', 'lol', 'hots', 'hs', 'dota2']),
          hometeam: Joi.string()
            .optional()
            .max(30),
          awayteam: Joi.string()
            .optional()
            .max(30),
          datefrom: Joi.date().iso()
            .optional()
            .default(new Date(), 'current time with date'),
          dateto: Joi.date().iso()
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
    },
  },
];

export default matchRoutes;
