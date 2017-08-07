import MatchController from '../controllers/match-controller.js';

const matchRoutes = [
  {
    path: '/v1/matches',
    method: 'GET',
    handler: MatchController.getMatches,
    config: {
      auth: false,
    },
  },
];

export default matchRoutes;
